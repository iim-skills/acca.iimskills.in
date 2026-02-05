"use client";

import React, { useEffect, useState } from "react";
import { X, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

type EnrolModalProps = {
  onClose: () => void;
  adminName?: string;
};

export default function EnrolModal({ onClose, adminName }: EnrolModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // STEP 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // STEP 2
  const courseName = "ACCA Professional Education";
  const [modules, setModules] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  /* -------- LOAD MODULES FROM course.json -------- */
  useEffect(() => {
    fetch("/api/admin/courses")
      .then((res) => res.json())
      .then((data) => {
        const acca = data.find((c: any) => c.slug === "acca-professional");
        if (acca?.modules) setModules(acca.modules);
      })
      .catch(() => {});
  }, []);

  const toggleModule = (m: string) => {
    setSelectedModules((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  /* -------- SUBMIT -------- */
  const handleSubmit = async () => {
    setError("");

    if (!selectedModules.length) {
      setError("Please select at least one module");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lms/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          courseSlug: "acca-professional",
          courseTitle: courseName,
          modules: selectedModules,
          enrolledBy: adminName || "Admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enrollment failed");

      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 relative">

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400">
          <X />
        </button>

        {/* ---------- STEP INDICATOR ---------- */}
        <p className="text-xs font-bold text-indigo-600 mb-2">
          STEP {step} OF 2
        </p>

        <h2 className="text-2xl font-bold mb-4">
          {step === 1 ? "Student Details" : "Assign Course Modules"}
        </h2>

        {/* ---------- STEP 1 ---------- */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              placeholder="Student Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border"
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border"
            />
            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border"
            />

            <button
              onClick={() => {
                if (!name || !email || !phone) {
                  setError("All fields are required");
                  return;
                }
                setStep(2);
              }}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold flex justify-center gap-2"
            >
              Next <ArrowRight />
            </button>
          </div>
        )}

        {/* ---------- STEP 2 ---------- */}
        {step === 2 && (
          <div className="space-y-4">
            <input
              value={courseName}
              disabled
              className="w-full p-3 rounded-xl bg-slate-100 border font-semibold"
            />

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {modules.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(m)}
                    onChange={() => toggleModule(m)}
                  />
                  {m}
                </label>
              ))}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-bold flex justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Enroll Student
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
