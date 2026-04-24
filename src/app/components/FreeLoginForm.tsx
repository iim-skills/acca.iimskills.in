"use client";

import React, { useState } from "react";
import {
  Mail,
  Loader2,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

function generateCaptcha(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

type Props = {
  onBack: () => void;
  onSuccess: (data: any, email: string) => void;
};

export default function FreeLoginForm({ onBack, onSuccess }: Props) {
  const [freeEmail, setFreeEmail] = useState("");
  const [freeName, setFreeName] = useState("");
  const [freePhone, setFreePhone] = useState("");
  const [loadingFree, setLoadingFree] = useState(false);
  const [freeError, setFreeError] = useState<string | null>(null);

  const [captchaCode, setCaptchaCode] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

  const isCaptchaValid = captchaInput.trim() === captchaCode;
  const isFormValid =
    freeName.trim() &&
    freePhone.trim() &&
    freeEmail.trim() &&
    isCaptchaValid;

  const handleSubmit = async () => {
    setFreeError(null);

    const cleanEmail = freeEmail.trim().toLowerCase();
    const name = freeName.trim();
    const phone = freePhone.trim();

    if (!name) return setFreeError("Please enter your name.");
    if (!phone) return setFreeError("Please enter your phone number.");
    if (!cleanEmail) return setFreeError("Please enter your email.");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return setFreeError("Please enter a valid email address.");
    }

    if (!isCaptchaValid) {
      setFreeError("Invalid CAPTCHA. Please try again.");
      refreshCaptcha();
      return;
    }

    setLoadingFree(true);

    try {
      // HubSpot
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: name,
          phone,
          email: cleanEmail,
          source: "Free Course Login",
        }),
      });

      // Free login
      const res = await fetch("/api/student/free-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
          name: name,
          phone,
          email: cleanEmail,
           
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        setFreeError(data?.error || "Something went wrong");
        return;
      }

      onSuccess(data, cleanEmail);
    } catch {
      setFreeError("Network error, please try again.");
    } finally {
      setLoadingFree(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl space-y-5">
      {/* NAME */}
      <input
        type="text"
        placeholder="Enter your name"
        value={freeName}
        onChange={(e) => setFreeName(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm"
      />

      {/* PHONE */}
      <PhoneInput
        country={"in"}
        value={freePhone}
        onChange={(phone) => setFreePhone(phone)}
        enableSearch
        inputClass="!w-full !bg-slate-50 !border !border-slate-200 !rounded-lg !py-2.5 !pl-14"
      />

      {/* EMAIL */}
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="email"
          placeholder="Enter email"
          value={freeEmail}
          onChange={(e) => setFreeEmail(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 text-sm"
        />
      </div>

      {/* CAPTCHA */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Verification Code
                    </span>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="text-[11px] text-[#404eed] font-bold hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> Refresh
                    </button>
                  </div>
<div className="flex gap-2">
                  <div className="w-full bg-white border border-slate-200 rounded-xl py-2 text-center font-mono text-base font-black tracking-[0.4em] text-slate-700 select-none shadow-sm italic">
                    {captchaCode}
                  </div>

                  <input
                    type="text"
                    placeholder="Enter the code"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="w-full px-2 py-2 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#404eed] transition-all bg-white text-center font-bold tracking-widest"
                    disabled={loadingFree}
                  />
                </div>

                {freeError && (
                  <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-lg border border-red-100">
                    {freeError}
                  </div>
                )}
</div>

      <button
        onClick={handleSubmit}
        disabled={loadingFree || !isFormValid}
        className="w-full py-3 bg-[#404eed] text-white rounded-xl"
      >
        {loadingFree ? <Loader2 className="animate-spin" /> : "Claim Free Access"}
      </button>

      <button onClick={onBack} className="text-sm text-gray-500 flex items-center gap-1">
        <ChevronLeft size={14} /> Back to <span className="font-bold text-emerald-700">Standard Login</span>
      </button>
    </div>
  );
}