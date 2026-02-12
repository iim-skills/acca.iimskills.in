"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Phone as PhoneIcon,
  BookOpen,
  Check,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Flag,
  ArrowBigRight,
} from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

type EnrolModalProps = {
  onClose: () => void;
  adminName?: string;
};

const PER_MODULE_PRICE = 20000; // ₹20,000 per module
const GST_RATE = 0.18; // 18%

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function EnrolModal({ onClose, adminName }: EnrolModalProps) {
  // UI state
  // step 1 = show form, step 2 = show modules. (We use this to toggle left column.)
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields (step 1)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Course/modules
  const skillsSlug = "acca-skills-level";
  const [availableCourse, setAvailableCourse] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Agreement checkbox (step 2)
  const [agreed, setAgreed] = useState(false);

  /* -------- LOAD COURSES / MODULES -------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/courses");
        if (!res.ok) throw new Error("Failed to load courses");
        const data = await res.json();
        const skills = Array.isArray(data)
          ? data.find((c: any) => c.slug === skillsSlug)
          : null;
        if (skills) {
          setAvailableCourse(skills);
          const modList = Array.isArray(skills.modules)
            ? skills.modules.map((m: any) => {
                const id = m.moduleId ?? m.id ?? m.slug ?? String(m.name);
                return { id, name: m.name ?? m.title ?? id, description: m.description ?? "" };
              })
            : [];
          setModules(modList);
        } else {
          setAvailableCourse(null);
          setModules([]);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setAvailableCourse(null);
        setModules([]);
      }
    })();
  }, []);

  /* =================
     Prefill: localStorage user, course_user_key, ?prefillEmail
     ================== */
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.email) setEmail(String(parsed.email).toLowerCase());
          if (parsed?.name) setName(String(parsed.name));
          if (parsed?.phone) setPhone(String(parsed.phone));
          return;
        } catch {
          // not JSON — continue
        }
      }

      const key = typeof window !== "undefined" ? localStorage.getItem("course_user_key") : null;
      if (key && key.includes("@")) {
        setEmail(String(key).toLowerCase());
        return;
      }

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const e = params.get("prefillEmail");
        if (e && /^\S+@\S+\.\S+$/.test(e)) {
          setEmail(String(e).toLowerCase());
          return;
        }
      }
    } catch (err) {
      console.warn("Prefill failed:", err);
    }
  }, []);

  /* ---------- Module selection ---------- */
  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((x) => x !== moduleId) : [...prev, moduleId]
    );
  };

  // helper: all module ids
  const allModuleIds = modules.map((m) => m.id);
  const allSelected = modules.length > 0 && selectedModules.length === modules.length;

  // select/deselect all modules
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedModules([]);
    } else {
      setSelectedModules(allModuleIds.slice()); // copy
    }
  };

  /* ---------- Price calculations ---------- */
  const modulesSubtotal = selectedModules.length * PER_MODULE_PRICE;
  const gstAmount = Math.round(modulesSubtotal * GST_RATE);
  const totalFee = modulesSubtotal + gstAmount;

  /* ---------- Validation ---------- */
  const isFormValid = () => {
    if (!name.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) return false;
    if (!phone.trim() || phone.trim().length < 6) return false;
    return true;
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

  /* ---------- Enrollment + Payment flow (unchanged) ---------- */
  const handleSubmit = async () => {
    setError("");

    if (!availableCourse || availableCourse.slug !== skillsSlug) {
      setError("Active course modules not loaded.");
      return;
    }
    if (!selectedModules.length) {
      setError("Please select at least one module");
      return;
    }
    if (!agreed) {
      setError("Please agree to the website terms and conditions before proceeding to payment.");
      return;
    }

    setLoading(true);

    try {
      // 1) Call enrol API to create or upgrade student
      const enrolResp = await fetch("/api/lms/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || email.split("@")[0],
          email: (email || "").toString().trim().toLowerCase(),
          phone: phone || "",
          courseSlug: availableCourse.slug,
          courseTitle: availableCourse.name || availableCourse.title || "ACCA Skills Level",
          modules: selectedModules,
          enrolledBy: adminName ?? "Admin",
        }),
      });

      const enrolData = await enrolResp.json();
      if (!enrolResp.ok) {
        throw new Error(enrolData.error || enrolData.message || "Enrollment failed");
      }

      // store session locally (optional)
      try {
        if (enrolData?.email) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              email: String(enrolData.email).toLowerCase(),
              name: name || "",
              phone: phone || "",
              loginType: "student",
              role: "student",
            })
          );
          localStorage.setItem("course_user_key", String(enrolData.email).toLowerCase());
        }
      } catch {
        // ignore storage errors
      }

      // 2) Create Razorpay order on server
      const orderRes = await fetch("/api/razorpay-order/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalFee * 100, // rupees to paise
          name,
          email,
          phone,
          course: availableCourse.name,
          modules: selectedModules,
          enrolId: enrolData?.studentId ?? null,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData?.id) {
        throw new Error(orderData?.error || "Failed to initialize payment");
      }

      // 3) Open Razorpay checkout
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Failed to load payment SDK.");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || (window as any).__RAZORPAY_KEY || "rzp_test_xxx",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: availableCourse.name || "ACCA Skills",
        description: `${selectedModules.length} module(s) - ${selectedModules.join(", ")}`,
        order_id: orderData.id,
        prefill: { name, email, contact: phone },
        handler: async function (paymentResponse: any) {
          try {
            // Optionally verify server-side
            // await fetch("/api/razorpay/verify", { method: "POST", headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...paymentResponse, enrolId: enrolData.studentId }) });
            alert("Payment successful! Enrollment completed.");
            onClose();
          } catch (err) {
            console.warn("Payment verification failed locally:", err);
            alert("Payment succeeded, but verification failed. Admin will verify and update access.");
            onClose();
          }
        },
        modal: {
          ondismiss: function () {
            // user dismissed checkout - leave them on the modal
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong while processing enrollment.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI handlers ---------- */
  const handleProceedToModules = () => {
    setError("");
    if (!isFormValid()) {
      setError("Please fill name, valid email and phone before selecting modules.");
      return;
    }
    // reset agreement whenever user moves fresh to modules to ensure explicit consent
    setAgreed(false);
    // hide form -> show modules
    setStep(2);
  };

  const handleBackToForm = () => {
    setStep(1);
    // clear agreement when going back
    setAgreed(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      <div className="relative w-full bg-white overflow-hidden z-10">
        {/* Top header with course title */}
        <div className="w-full bg-gradient-to-b from-[#1e3799] to-[#0c2461] p-10 flex flex-col justify-between text-white relative">
          <div className="w-full max-w-6xl xl:w-6xl py-5 mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-indigo-50">
                <GraduationCap size={28} className="text-indigo-600" />
              </div>
              <div>
                <div className="text-xs uppercase font-semibold text-indigo-400">Pay & Start Learning</div>
                <h3 className="text-2xl font-extrabold text-white">
                  {availableCourse?.name ?? "ACCA Skills Level"}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Body: two column layout */}
        <div className="w-full max-w-6xl xl:w-6xl mx-auto flex gap-8 py-8">
          {/* Left: form or modules (wider) */}
          <div className="flex-1 border-2 border-indigo-200 p-5 rounded-2xl min-w-0 bg-white">
            {/* Form (step 1) */}
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-left-4">
                <div className="text-lg font-bold text-indigo-700">1. Basic Details</div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      placeholder="Full Student Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-900 font-medium"
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      placeholder="Academic Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-900 font-medium"
                    />
                  </div>

                  <div className="relative group">
                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <div>
                      <PhoneInput
                        country={"in"}
                        value={phone}
                        onChange={(value: string) => setPhone(value)}
                        enableSearch
                        containerClass="p-1 rounded-2xl bg-slate-50 border border-transparent"
                        buttonClass="react-phone-button !border-0"
                        inputClass="!py-2 !pl-12 !text-gray-600 !border-none"
                        dropdownClass="react-phone-dropdown !border-0"
                        placeholder="Contact Number"
                        inputProps={{ name: "phone", required: true, autoFocus: false }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="flex gap-2"><ArrowBigRight className="text-blue-400 w-10 h-10"/>Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.</p>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleProceedToModules}
                    className={`px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 transition-all ${isFormValid() ? "" : "opacity-60 pointer-events-none"}`}
                  >
                    Select Modules <ChevronRight size={18} />
                  </button>

                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Modules (step 2) */}
            {step === 2 && (
              <div className=" space-y-6 animate-in slide-in-from-left-4">
                <div className="flex items-end justify-between border-b border-gray-600 pb-2 border-dotted">
                  <div className="space-y-2">
                  <div className="text-sm font-semibold">Select Modules</div>
                  <div className="text-lg font-bold text-indigo-700">2. Select Modules You Want To Study</div>
                  </div>
                  {/* NEW: Select All / Deselect All button */}
                  <div>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm px-3 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto pr-2 custom-scrollbar border-b border-gray-600 pb-2 border-dotted">
                  {modules.length ? (
                    <div className="grid grid-cols-1 mb-3 gap-2">
                      {modules.map((m: any) => {
                        const id = m.id;
                        const isSelected = selectedModules.includes(id);
                        return (
                          <label
                            key={id}
                            className="flex items-center gap-4 p-1 rounded-2xl"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleModule(id)}
                              className="w-4 h-4 text-indigo-600 rounded-full"
                            />
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${isSelected ? "text-indigo-900" : "text-gray-700"}`}>{m.name}</div>
                              {/* optional subtitle */}
                            </div>
                            <div className="text-sm font-semibold">₹{PER_MODULE_PRICE.toLocaleString()}</div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium italic">Scanning for available modules...</p>
                    </div>
                  )}
                </div>

                {/* Agreement checkbox (NEW) */}
                <div className="mt-3 flex items-start gap-3">
                  <input
                    id="termsAgree"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (e.target.checked) setError("");
                    }}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="termsAgree" className="text-sm text-gray-700">
                    I have read and agree to the website <a href="/terms" target="_blank" rel="noreferrer" className="text-indigo-600 underline">terms and conditions</a>.
                  </label>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-2">
                    <div className="w-1 h-4 bg-red-600 rounded-full" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-3">
                  <button onClick={handleBackToForm} className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                    Back to Details
                  </button>

                  {/* Payment button is disabled unless user has AGREED */}
                  {/* <button
                    onClick={handleSubmit}
                    disabled={loading || selectedModules.length === 0 || !agreed}
                    className={`flex-1 px-6 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none ${
                      loading || selectedModules.length === 0 || !agreed ? "bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : (<><CheckCircle2 size={16} /> Secure Payment</>)}
                  </button> */}
                </div>
              </div>
            )}
          </div>

          {/* Right: Order summary (narrow) */}
          <aside className="w-[280px] min-w-[260px]">
            <div className="p-5 rounded-xl border border-2 border-indigo-200 p-5 rounded-2xl bg-white sticky top-6">
              <div className="text-sm font-semibold">Order Summary</div>
              <h4 className="text-md font-bold text-indigo-700 mt-2">
                {availableCourse?.name ?? "ACCA Skills Level"}
              </h4>

              <div className="mt-4 border-t border-dashed pt-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Modules selected</span>
                  <span>{selectedModules.length}</span>
                </div>

                <div className="flex justify-between text-sm mt-2">
                  <span>Subtotal</span>
                  <span>₹{modulesSubtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm mt-1">
                  <span>GST (18%)</span>
                  <span>₹{gstAmount.toLocaleString()}</span>
                </div>

                <hr className="my-3" />

                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>₹{totalFee.toLocaleString()}</span>
                </div>

                <div className="text-xs text-gray-400 mt-2">Charged in INR at checkout</div>
              </div>

              {/* quick CTA on right column too */}
              <div className="mt-4">
                {step === 1 ? (
                  <button
                    onClick={handleProceedToModules}
                    className={`w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold ${isFormValid() ? "" : "opacity-60 pointer-events-none"}`}
                  >
                    Continue to Modules
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading || selectedModules.length === 0 || !agreed}
                    className={`w-full py-3 rounded-2xl text-white font-bold disabled:opacity-50 disabled:pointer-events-none ${
                      loading || selectedModules.length === 0 || !agreed ? "bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {loading ? "Processing..." : "Secure Payment"}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
