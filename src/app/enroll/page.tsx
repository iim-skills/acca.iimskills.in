"use client";
 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import axios from "axios";
import { FaHandPointRight } from "react-icons/fa";

const courseDetails = {
aak: {
    title: "ACCA Applied Knowledge",
    url: "aak",
    programs: {
      expert: { name: "Expert Program", fee: 49900 },     
    },
  },
   
  aas: {
    title: "ACCA Applied Skill",
    url: "aas",
    programs: {
      expert: { name: "Self Paced Program", fee: 149900 },  
    },
  },
  acp: {
    title: "ACCA Strategic Professional",
    url: "acp",
    programs: {
      expert: { name: "Self Paced Program", fee: 99900 },
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

interface FormData {
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

/** Coupon shape based on your example */
interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiry: string; // ISO date like "2025-09-28"
  course?: string; // e.g. "dm" or "all"
  courseName?: string;
  program?: string; // e.g. "master" or "all"
  programName?: string;
}

export default function EnrollPage() {
  const router = useRouter();
  const [courseKey, setCourseKey] = useState<CourseKey>("aak");
  const [type, setType] = useState<ProgramKey>("expert");
  const [formData, setFormData] = useState<FormData>({
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
  });

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [paymentUnlocked, setPaymentUnlocked] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Live currency states
  const [currencyRate, setCurrencyRate] = useState(1);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [userCountry, setUserCountry] = useState("IN");

  const course = courseDetails[courseKey];
  const program = course.programs[type];
  const baseFee = program.fee;

  // 18% uplift (no GST breakdown)
  const feeWith18 = Math.round(baseFee * 1.18);

  // Keep coupon support (applied after 18% uplift)
  const totalFee = Math.max(feeWith18 - discount, 0);

  // Converted for UI only
  const convertedFee = Math.round(totalFee * currencyRate);

  useEffect(() => {
  async function testAllCountries() {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/INR");
      const data = await res.json();

      const rates = data.rates;
      const fee = feeWith18; // your final fee after +18%

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
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const courseParam = params.get("course");
      const typeParam = params.get("type");

      if (courseParam && courseParam in courseDetails) {
        setCourseKey(courseParam as CourseKey);
        const validPrograms = courseDetails[courseParam as CourseKey].programs;
        const availableTypes = Object.keys(validPrograms) as ProgramKey[];
        setType(
          typeParam && availableTypes.includes(typeParam as ProgramKey)
            ? (typeParam as ProgramKey)
            : availableTypes[0]
        );

        setFormData((prev) => ({
          ...prev,
          course: courseParam,
          programType: typeParam || availableTypes[0],
          url: courseDetails[courseParam as CourseKey].url,
        }));
      }
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

  // Detect country and fetch live INR conversion rates
  useEffect(() => {
    async function loadCurrency() {
      try {
        // 1) Detect country
        const geo = await fetch("https://ipapi.co/json/");
        const geoData = await geo.json();
        const cc = geoData?.country_code || "IN";
        setUserCountry(cc);

        // 2) Fetch live INR base rates
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
          // India or unsupported → INR
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => Object.values(formData).every((v) => v.trim() !== "");

  /**
   * Apply coupon logic:
   * - requires course/program match (or "all")
   * - expiry inclusive till end of day
   * - discount applied AFTER +18% uplift
   */
  const applyCoupon = () => {
    if (!coupon.trim()) return;

    const found = coupons.find((c) => c.code.toLowerCase() === coupon.trim().toLowerCase());
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

    if (couponCourse !== "all" && couponCourse !== courseKey.toString().toLowerCase()) {
      alert("This coupon does not apply to the selected course.");
      setDiscount(0);
      return;
    }

    if (couponProgram !== "all" && couponProgram !== type.toString().toLowerCase()) {
      alert("This coupon does not apply to the selected program.");
      setDiscount(0);
      return;
    }

    const discountAmount =
      found.type === "percent"
        ? Math.round((feeWith18 * found.value) / 100) // percent of uplifted fee
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
        courseName: course.title,
        programName: program.name,
        fee: totalFee, // INR final fee
        discount,
        couponCode: coupon,
      });
      setActiveTab(2);
      setPaymentUnlocked(true);
    } catch {
      alert("Failed to submit details.");
    }
    setLoading(false);
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
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) return alert("Failed to load Razorpay SDK.");

    try {
      const res = await fetch("/api/razorpay-order/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalFee * 100, // INR paise
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          course: course.title,
          program: program.name,
          billing: formData.address,
          pincode: formData.pincode,
          cityState: formData.cityState,
          country: formData.country,
        }),
      });

      const data = await res.json();
      if (!data?.id) return alert("Failed to create Razorpay order.");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_live_ou7Grny4mPDOjy",
        amount: data.amount,
        currency: "INR",
        name: course.title,
        description: program.name,
        order_id: data.id,
        handler: function () {
          alert("Payment successful!");
          window.location.href = "/";
        },
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: "#108BF2" },
      };

      if (window.Razorpay) new window.Razorpay(options).open();
    } catch (error) {
      console.error(error);
      alert("Payment failed. Try again.");
    }
  };

  const handleCCAvenuePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const orderId = `IIMSKILLS_${Date.now()}`;
      const res = await axios.post("/api/ccavenue-order/", {
        orderId,
        amount: totalFee.toString(), // INR
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

    /* ================= PAYU HANDLER (NEW) ================= */
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
          {course.title} <span className="text-blue-600">{program.name}</span>
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
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name*"
                    className="border-1 border-gray-300 p-2 rounded-sm h-full"
                    required
                  />
                  <PhoneInput
                    country={"in"}
                    value={formData.phone}
                    onChange={(phone) => setFormData({ ...formData, phone })}
                    inputStyle={{
                      width: "100%",
                      padding: "10px 10px 10px 45px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email ID*"
                    className="border-1 border-gray-300 p-2 rounded-sm h-full"
                    required
                  />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Billing Address*"
                    className="border-1 border-gray-300 p-2 rounded-sm h-full"
                    required
                  />
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode*"
                    className="border-1 border-gray-300 p-2 rounded-sm h-full"
                    required
                  />
                  <input
                    type="text"
                    name="cityState"
                    value={formData.cityState}
                    onChange={handleChange}
                    placeholder="City, State*"
                    className="border-1 border-gray-300 p-2 rounded-sm h-full"
                    required
                  />
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="border-1 border-gray-300 p-2 rounded-sm h-full"
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

                {/* Final amount only (converted) */}
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

                {/* Payment Buttons */}
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
            {course.title} {program.name}
          </p>
          <hr className="my-2" />

          {/* Show only final amount (converted) */}
          {/* <p className="text-sm font-semibold">
            Program Fee (incl. +18%):{" "}
            {currencySymbol}
            {Math.round(feeWith18 * currencyRate).toLocaleString()}
          </p> */}

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
