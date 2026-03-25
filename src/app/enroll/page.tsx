"use client";

import { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import axios from "axios";
import { FaHandPointRight } from "react-icons/fa";

const courseDetails = {
  aak: {
    title: "ACCA ",
    url: "acca-applied-knowledge",
    programs: {
      expert: { name: "Applied Knowledge Program", fee: 0 },
    },
  },
  aas: {
    title: "ACCA",
    url: "acca-applied-skills-level",
    programs: {
      expert: { name: "Applied Skill Program", fee: 0 },
    },
  },
  acp: {
    title: "ACCA ",
    url: "acca-professional-level",
    programs: {
      expert: { name: "Strategic Professional Program", fee: 99900 },
    },
  },
} as const;

type CourseKey = keyof typeof courseDetails;
type ProgramKey = keyof (typeof courseDetails)[CourseKey]["programs"];

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface EnrollmentFormData {
  course: string;
  programType: string;
  url: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  cityState: string;
  country: string;
}

interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiry: string;
  course?: string;
  courseName?: string;
  program?: string;
  programName?: string;
}

export default function EnrollPage() {
  const [courseKey, setCourseKey] = useState<CourseKey>("aak");
  const [type, setType] = useState<ProgramKey>("expert");
  const [selectedCourseName, setSelectedCourseName] = useState("");

  const [formData, setFormData] = useState<EnrollmentFormData>(() => ({
    course: courseKey,
    programType: type,
    url: courseDetails[courseKey].url,
    name: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
    cityState: "",
    country: "India",
  }));

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [paymentUnlocked, setPaymentUnlocked] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [locked, setLocked] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFound, setProfileFound] = useState(false);

  const [currencyRate, setCurrencyRate] = useState(1);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [userCountry, setUserCountry] = useState("IN");

  const course = courseDetails[courseKey];
  const program = course.programs[type];
  const baseFee = program.fee;

  const feeWith18 = Math.round(baseFee * 1.18);
  const totalFee = Math.max(feeWith18 - discount, 0);
  const convertedFee = Math.round(totalFee * currencyRate);

  useEffect(() => {
    async function testAllCountries() {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/INR");
        const data = await res.json();

        const rates = data.rates;
        const fee = feeWith18;

        console.log("✅ FINAL FEE (INR):", fee);

        const allPrices = {
          INR: fee,
          AED: Math.round(fee * rates.AED),
          USD: Math.round(fee * rates.USD),
          GBP: Math.round(fee * rates.GBP),
          CAD: Math.round(fee * rates.CAD),
          AUD: Math.round(fee * rates.AUD),
          EUR: Math.round(fee * rates.EUR),
          SGD: Math.round(fee * rates.SGD),
        };

        console.log("✅ ALL COUNTRY PRICES:", allPrices);
      } catch (error) {
        console.log("Currency check failed:", error);
      }
    }

    testAllCountries();
  }, [feeWith18]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const courseParam = params.get("course");
    const typeParam = params.get("type");
    const nameParam = params.get("name");

    if (courseParam && courseParam in courseDetails) {
      const typedCourse = courseParam as CourseKey;
      setCourseKey(typedCourse);

      const validPrograms = courseDetails[typedCourse].programs;
      const availableTypes = Object.keys(validPrograms) as ProgramKey[];

      const resolvedType =
        typeParam && availableTypes.includes(typeParam as ProgramKey)
          ? (typeParam as ProgramKey)
          : availableTypes[0];

      setType(resolvedType);
      setSelectedCourseName(nameParam ? decodeURIComponent(nameParam) : "");

      setFormData((prev) => ({
        ...prev,
        course: typedCourse,
        programType: resolvedType,
        url: courseDetails[typedCourse].url,
      }));
    }
  }, []);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await axios.get("/api/admin/coupons");
        setCoupons(res.data.coupons || []);
      } catch (error) {
        console.error("Failed to load coupons", error);
      }
    };

    fetchCoupons();
  }, []);

  useEffect(() => {
    async function loadCurrency() {
      try {
        const geo = await fetch("https://ipapi.co/json/");
        const geoData = await geo.json();
        const cc = geoData?.country_code || "IN";
        setUserCountry(cc);

        const res = await fetch("https://open.er-api.com/v6/latest/INR");
        const data = await res.json();

        let symbol = "₹";
        let rate = 1;

        if (cc === "AE") {
          rate = data.rates?.AED ?? 1;
          symbol = "AED ";
        } else if (cc === "US") {
          rate = data.rates?.USD ?? 1;
          symbol = "$ ";
        } else if (cc === "GB") {
          rate = data.rates?.GBP ?? 1;
          symbol = "£ ";
        } else if (cc === "CA") {
          rate = data.rates?.CAD ?? 1;
          symbol = "CA$ ";
        } else if (cc === "AU") {
          rate = data.rates?.AUD ?? 1;
          symbol = "A$ ";
        } else {
          rate = 1;
          symbol = "₹";
        }

        setCurrencyRate(rate);
        setCurrencySymbol(symbol);
      } catch (err) {
        console.log("currency error", err);
        setCurrencyRate(1);
        setCurrencySymbol("₹");
      }
    }

    loadCurrency();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    return (
      formData.name.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.address.trim() !== "" &&
      formData.pincode.trim() !== "" &&
      formData.cityState.trim() !== "" &&
      formData.country.trim() !== ""
    );
  };

  const applyCoupon = () => {
    if (!coupon.trim()) return;

    const found = coupons.find(
      (c) => c.code.toLowerCase() === coupon.trim().toLowerCase()
    );

    if (!found) {
      alert("Invalid coupon code.");
      setDiscount(0);
      return;
    }

    const today = new Date();
    const expiryDate = new Date(found.expiry + "T23:59:59");
    if (today > expiryDate) {
      alert("Coupon is expired.");
      setDiscount(0);
      return;
    }

    const couponCourse = (found.course || "all").toString().toLowerCase();
    const couponProgram = (found.program || "all").toString().toLowerCase();

    if (
      couponCourse !== "all" &&
      couponCourse !== courseKey.toString().toLowerCase()
    ) {
      alert("This coupon does not apply to the selected course.");
      setDiscount(0);
      return;
    }

    if (
      couponProgram !== "all" &&
      couponProgram !== type.toString().toLowerCase()
    ) {
      alert("This coupon does not apply to the selected program.");
      setDiscount(0);
      return;
    }

    const discountAmount =
      found.type === "percent"
        ? Math.round((feeWith18 * found.value) / 100)
        : found.value;

    setDiscount(discountAmount);
    alert("Coupon applied successfully!");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/enroll", {
        ...formData,
        course: courseKey,
        courseName: selectedCourseName || course.title,
        programType: type,
        programName: program.name,
        fee: totalFee,
        discount,
        couponCode: coupon,
      });

      setActiveTab(2);
      setPaymentUnlocked(true);
    } catch (error) {
      console.error(error);
      alert("Failed to submit details.");
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (document.getElementById("razorpay-script")) return resolve(true);
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleRazorpayPayment = async () => {
    if (totalFee <= 0) {
      alert("Free course enrolled successfully!");
      window.location.href = "/student";
      return;
    }

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert("Razorpay SDK failed to load.");
      return;
    }

    try {
      const res = await fetch("/api/razorpay-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalFee * 100,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          course: courseKey,
          courseName: selectedCourseName || course.title,
          program: type,
          programName: program.name,
          billing: formData.address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Order failed");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY!,
        amount: data.amount,
        currency: "INR",
        name: course.title,
        description: program.name,
        order_id: data.id,
        handler: function () {
          alert("Payment successful!");
          window.location.href = "/";
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#108BF2",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    }
  };

  const handleCCAvenuePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const orderId = `IIMSKILLS_${Date.now()}`;
      const res = await axios.post("/api/ccavenue-order/", {
        orderId,
        amount: totalFee.toString(),
        ...formData,
      });

      const form = document.createElement("form");
      form.method = "POST";
      form.action =
        "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

      const encRequest = document.createElement("input");
      encRequest.type = "hidden";
      encRequest.name = "encRequest";
      encRequest.value = res.data.encRequest;

      const accessCode = document.createElement("input");
      accessCode.type = "hidden";
      accessCode.name = "access_code";
      accessCode.value = res.data.access_code;

      form.appendChild(encRequest);
      form.appendChild(accessCode);
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error(error);
      alert("Failed to initiate CCAvenue payment.");
    }
  };

  useEffect(() => {
    const email = formData.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      setLocked(false);
      setProfileFound(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setProfileLoading(true);

        const res = await fetch(
          `/api/student/profile?email=${encodeURIComponent(email)}`
        );

        const data = await res.json();

        console.log("✅ PROFILE RESPONSE:", data);

        if (data?.found && data?.student) {
          const s = data.student;

          setFormData((prev) => ({
            ...prev,
            name: s.name || "",
            phone: s.phone || "",
            address: s.address || "",
            pincode: s.pincode || "",
            cityState: s.cityState || "",
            country: s.country || "India",
          }));

          setLocked(true);
          setProfileFound(true);
        } else {
          setLocked(false);
          setProfileFound(false);
        }
      } catch (err) {
        console.error(err);
        setLocked(false);
        setProfileFound(false);
      } finally {
        setProfileLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handlePayUPayment = async () => {
    try {
      const txnid = `TXN_${Date.now()}`;

      const res = await fetch("/api/payu/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txnid,
          amount: totalFee.toString(),
          productinfo: `${course.title} - ${program.name}`,
          firstname: formData.name,
          email: formData.email,
          phone: formData.phone,
        }),
      });

      const data = await res.json();
      if (!data.hash) return alert("PayU initialization failed");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.payuUrl;

      const fields: Record<string, string> = {
        key: data.key,
        txnid,
        amount: totalFee.toString(),
        productinfo: `${course.title} - ${program.name}`,
        firstname: formData.name,
        email: formData.email,
        phone: formData.phone,
        surl: `${window.location.origin}/api/payu/success`,
        furl: `${window.location.origin}/payment-failed`,
        hash: data.hash,
      };

      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error(err);
      alert("PayU payment failed");
    }
  };

  console.log("EMAIL STATE:", formData.email);

  return (
    <div className="px-4">
      <div
        className="w-full py-10 bg-[#eff9fd]"
        style={{
          backgroundImage: "url('/DM/BackgroundTexture.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <h2 className="text-2xl font-bold text-center mb-3">
          Pay & Start Learning
        </h2>
        <h1 className="text-4xl font-bold text-center mb-10">
          {(selectedCourseName || course.title)}{" "}
          <span className="text-blue-600">{program.name}</span>
        </h1>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 py-15">
        <div className="md:col-span-2">
          {/* Step 1: Basic Details */}
          <div
            className="bg-white rounded-lg shadow px-6 py-3 mb-6 border border-blue-300"
            onClick={() => setActiveTab(1)}
          >
            <h3 className="text-xl font-bold text-blue-700">
              1. Basic Details
            </h3>

            {activeTab === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
                  <input
  type="email"
  name="email"
  value={formData.email}
  onChange={async (e) => {
    const email = e.target.value;

    setFormData((prev) => ({
      ...prev,
      email,
    }));

    console.log("🔥 EMAIL:", email);

    // ✅ DIRECT API CALL (NO useEffect dependency issue)
    if (!email.includes("@")) return;

    try {
      setProfileLoading(true);

      console.log("🚀 CALLING PROFILE API");

      const res = await fetch(
        `/api/student/profile?email=${encodeURIComponent(email)}`
      );

      const data = await res.json();

      console.log("✅ PROFILE RESPONSE:", data);

      if (data?.found) {
        const s = data.student;

        setFormData((prev) => ({
          ...prev,
          email,
          name: s.name || "",
          phone: s.phone || "",
          address: s.address || "",
          pincode: s.pincode || "",
          cityState: s.cityState || "",
          country: s.country || "India",
        }));

        setLocked(true);
        setProfileFound(true);
      } else {
        setLocked(false);
        setProfileFound(false);
      }
    } catch (err) {
      console.error(err);
      setLocked(false);
    } finally {
      setProfileLoading(false);
    }
  }}
  placeholder="Email*"
  className="border border-gray-300 p-2 rounded-sm h-full"
/>

                  {profileLoading && (
                    <p className="text-blue-600 text-sm">
                      Checking student details...
                    </p>
                  )}

                  {profileFound && (
                    <p className="text-green-600 text-sm">
                      Existing student found. Details auto-filled and locked.
                    </p>
                  )}

                  {!profileFound && formData.email.includes("@") && !profileLoading && (
                    <p className="text-gray-500 text-sm">
                      No student record found. Please fill in the remaining details manually.
                    </p>
                  )}

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name*"
                    className={`border border-gray-300 p-2 rounded-sm h-full ${
                      locked ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    readOnly={locked}
                    required
                  />

                  <PhoneInput
                    country={"in"}
                    value={formData.phone}
                    onChange={(phone) =>
                      setFormData((prev) => ({ ...prev, phone }))
                    }
                    inputProps={{
                      name: "phone",
                      readOnly: locked,
                      disabled: locked,
                    }}
                    inputStyle={{
                      width: "100%",
                      padding: "10px 10px 10px 45px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: locked ? "#f3f4f6" : "white",
                      cursor: locked ? "not-allowed" : "text",
                    }}
                  />

                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Billing Address*"
                    className={`border border-gray-300 p-2 rounded-sm h-full`}
                     
                    required
                  />

                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode*"
                    className={`border border-gray-300 p-2 rounded-sm h-full`}
                    required
                  />

                  <input
                    type="text"
                    name="cityState"
                    value={formData.cityState}
                    onChange={handleChange}
                    placeholder="City, State*"
                    className={`border border-gray-300 p-2 rounded-sm h-full`}
                    required
                  />

                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`border border-gray-300 p-2 rounded-sm h-full `}
                     
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>

                <div className="py-4">
                  <p className="flex gap-3 text-sm">
                    <FaHandPointRight color="#108BF2" size={32} />
                    Your personal data will be used to process your order,
                    support your experience throughout this website, and for
                    other purposes described in our privacy policy.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm mb-3">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={() => setAgreedToTerms(!agreedToTerms)}
                    className="accent-blue-600"
                  />
                  I have read and agree to the website terms and conditions
                </label>

                <button
                  className={`px-6 py-2 rounded text-white ${
                    agreedToTerms
                      ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      : "bg-blue-300 cursor-not-allowed"
                  }`}
                  onClick={handleSubmit}
                  disabled={!agreedToTerms || loading}
                >
                  {loading ? "Submitting..." : "Proceed"}
                </button>
              </>
            )}
          </div>

          {/* Step 2: Payment */}
          <div
            className="bg-white rounded-lg shadow px-5 py-3"
            onClick={() => paymentUnlocked && setActiveTab(2)}
          >
            <h3 className="text-xl font-bold text-blue-700">
              2. Secure Payment
            </h3>

            {activeTab === 2 && paymentUnlocked && (
              <>
                <div className="mb-4 mt-7">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    className="border p-2 rounded mr-2"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                  <button
                    onClick={applyCoupon}
                    className={`text-white px-4 py-2 rounded ${
                      coupon.trim()
                        ? "bg-blue-600 cursor-pointer"
                        : "bg-blue-300"
                    }`}
                  >
                    Apply Coupon
                  </button>
                </div>

                <div className="flex justify-between text-sm font-bold mt-2">
                  <span>Grand Total</span>
                  <span>
                    {currencySymbol}
                    {convertedFee.toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Charged in INR at checkout: ₹{totalFee.toLocaleString()}
                </p>

                <div className="flex flex-row gap-4 mt-6">
                  <button
                    onClick={handleRazorpayPayment}
                    className="bg-green-600 text-white px-6 py-2 rounded cursor-pointer"
                  >
                    Pay Via Razorpay
                  </button>

                  <form onSubmit={handleCCAvenuePayment}>
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded cursor-pointer"
                      aria-label="Pay via CCAvenue"
                    >
                      Pay Via CCAvenue
                    </button>
                  </form>

                  {/* <button
                    onClick={handlePayUPayment}
                    disabled
                    className="bg-blue-300 text-white px-6 py-2 rounded cursor-not-allowed pointer-events-none"
                  >
                    Pay Via PayU
                  </button> */}
                </div>

                <div className="py-4">
                  <p className="flex gap-3 text-sm">
                    <FaHandPointRight color="#108BF2" size={22} />
                    Pay via Credit/Debit/NetBanking/UPI
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow px-6 py-3 border border-blue-300 h-fit sticky top-5">
          <h3 className="text-sm font-semibold mb-1">Order Summary</h3>
          <p className="font-bold text-lg mb-1 text-blue-700">
            {(selectedCourseName || course.title)} {program.name}
          </p>
          <hr className="my-2" />
          <hr className="my-3" />
          <div className="flex justify-between text-sm font-bold">
            <span>Grand Total</span>
            <span>
              {currencySymbol}
              {convertedFee.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Charged in INR at checkout: ₹{totalFee.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}