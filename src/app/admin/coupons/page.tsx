'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Coupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiry: string;
  applicability?: "all" | "single" | "min_modules";
  moduleId?: string | null;
  minModules?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function CouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [form, setForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    expiry: "",
    applicability: "all" as "all" | "single" | "min_modules",
    moduleId: "",
    minModules: "3",
    notes: "",
  });

  /* ================= FETCH COUPONS ================= */
  async function fetchCoupons() {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  /* ================= SUBMIT ================= */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.code.trim()) return alert("Code required");
    if (!form.value || Number(form.value) < 0)
      return alert("Valid value required");
    if (!form.expiry) return alert("Expiry required");

    const payload: any = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      expiry: form.expiry,
      applicability: form.applicability,
      notes: form.notes || null,
    };

    /* ===== Applicability Rules ===== */
    if (form.applicability === "single") {
      // ANY ONE MODULE allowed
      payload.moduleId = form.moduleId.trim() || null;
      payload.minModules = null;
    } else if (form.applicability === "min_modules") {
      const n = parseInt(form.minModules || "3", 10);
      if (isNaN(n) || n <= 0)
        return alert("Provide valid minimum modules");
      payload.minModules = n;
      payload.moduleId = null;
    } else {
      payload.moduleId = null;
      payload.minModules = null;
    }

    try {
      const res = await fetch("/api/admin/coupons", {
        method: editingCoupon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        return;
      }

      setCoupons(data.coupons || []);
      setDrawerOpen(false);
      setEditingCoupon(null);

      setForm({
        code: "",
        type: "percent",
        value: "",
        expiry: "",
        applicability: "all",
        moduleId: "",
        minModules: "3",
        notes: "",
      });
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save coupon");
    }
  }

  /* ================= EDIT ================= */
  function handleEdit(c: Coupon) {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      expiry: c.expiry.slice(0, 10),
      applicability: c.applicability || "all",
      moduleId: c.moduleId ?? "",
      minModules: String(c.minModules ?? 3),
      notes: c.notes ?? "",
    });
    setDrawerOpen(true);
  }

  /* ================= DELETE ================= */
  async function handleDelete(code: string) {
    if (!confirm("Delete coupon?")) return;

    try {
      const res = await fetch(
        `/api/admin/coupons?code=${encodeURIComponent(code)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete coupon.");
    }
  }

  return (
    <div className="p-6 bg-white rounded shadow relative">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Coupons List</h2>

        <button
          onClick={() => {
            setEditingCoupon(null);
            setDrawerOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Coupon
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left border-b-2 border-gray-300">
            <tr>
              <th className="p-2">Code</th>
              <th className="p-2">Type</th>
              <th className="p-2">Value</th>
              <th className="p-2">Expiry</th>
              <th className="p-2">Applicability</th>
              <th className="p-2">Module / Min</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {coupons.map((coupon) => (
              <tr
                key={coupon.code}
                className="hover:bg-gray-50 border-b-2 border-gray-300"
              >
                <td className="p-1">{coupon.code}</td>
                <td className="p-1">{coupon.type}</td>
                <td className="p-1">
                  {coupon.type === "percent"
                    ? `${coupon.value}%`
                    : `₹${coupon.value}`}
                </td>
                <td className="p-1">
                  {coupon.expiry?.slice(0, 10)}
                </td>
                <td className="p-1">
                  {coupon.applicability ?? "all"}
                </td>
                <td className="p-1">
                  {coupon.applicability === "single"
                    ? coupon.moduleId || "Any Single Module"
                    : coupon.applicability === "min_modules"
                    ? `>= ${coupon.minModules}`
                    : "All"}
                </td>
                <td className="p-1 space-x-2">
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.code)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No coupons available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= DRAWER ================= */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28 }}
            className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-xl z-50 p-6 overflow-y-auto rounded-l-xl"
          >
            <h3 className="text-lg font-bold mb-4">
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
                placeholder="Coupon Code"
                className="w-full border p-2 rounded"
                disabled={!!editingCoupon}
              />

              <div className="flex gap-2">
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as any,
                    })
                  }
                  className="flex-1 border p-2 rounded"
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>

                <input
                  required
                  type="number"
                  value={form.value}
                  onChange={(e) =>
                    setForm({ ...form, value: e.target.value })
                  }
                  placeholder="Value"
                  className="w-28 border p-2 rounded"
                />
              </div>

              <input
                required
                type="date"
                value={form.expiry}
                onChange={(e) =>
                  setForm({ ...form, expiry: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              {/* Applicability */}
              <div className="space-y-2">
                <div className="text-sm font-semibold">
                  Applicability
                </div>

                <label className="flex gap-2">
                  <input
                    type="radio"
                    checked={form.applicability === "all"}
                    onChange={() =>
                      setForm({
                        ...form,
                        applicability: "all",
                        moduleId: "",
                      })
                    }
                  />
                  All modules
                </label>

                <label className="flex gap-2">
                  <input
                    type="radio"
                    checked={form.applicability === "single"}
                    onChange={() =>
                      setForm({
                        ...form,
                        applicability: "single",
                      })
                    }
                  />
                  Any Single Module (1 use per email)
                </label>

                {form.applicability === "single" && (
                  <input
                    placeholder="Optional specific moduleId"
                    value={form.moduleId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        moduleId: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                  />
                )}

                <label className="flex gap-2">
                  <input
                    type="radio"
                    checked={form.applicability === "min_modules"}
                    onChange={() =>
                      setForm({
                        ...form,
                        applicability: "min_modules",
                      })
                    }
                  />
                  Minimum modules
                </label>

                {form.applicability === "min_modules" && (
                  <input
                    type="number"
                    min={1}
                    value={form.minModules}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        minModules: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                  />
                )}
              </div>

              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setEditingCoupon(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingCoupon ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
