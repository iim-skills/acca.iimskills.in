"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, CheckCircle2, XCircle } from "lucide-react";

/* ================= TYPES ================= */

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

/* ================= PAGE ================= */

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

  /* ================= FETCH ================= */

  async function fetchCoupons() {
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data.coupons || []);
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  /* ================= STATS ================= */

  const totalCoupons = coupons.length;

  const activeCoupons = coupons.filter(
    (c) => new Date(c.expiry) >= new Date()
  ).length;

  const expiredCoupons = coupons.filter(
    (c) => new Date(c.expiry) < new Date()
  ).length;

  /* ================= SUBMIT ================= */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: any = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      expiry: form.expiry,
      applicability: form.applicability,
      notes: form.notes || null,
    };

    if (form.applicability === "single") {
      payload.moduleId = form.moduleId.trim() || null;
      payload.minModules = null;
    } else if (form.applicability === "min_modules") {
      payload.minModules = Number(form.minModules);
      payload.moduleId = null;
    } else {
      payload.moduleId = null;
      payload.minModules = null;
    }

    const res = await fetch("/api/admin/coupons", {
      method: editingCoupon ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setCoupons(data.coupons);
    setDrawerOpen(false);
    setEditingCoupon(null);
  }

  /* ================= DELETE ================= */

  async function handleDelete(code: string) {
    if (!confirm("Delete coupon?")) return;

    const res = await fetch(
      `/api/admin/coupons?code=${encodeURIComponent(code)}`,
      { method: "DELETE" }
    );

    const data = await res.json();
    setCoupons(data.coupons);
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

  return (
    <div className="space-y-6">

      {/* ================= TOP STATS ================= */}

      <div className="grid md:grid-cols-3 gap-4">

        <StatCard
          title="Total Coupons"
          value={totalCoupons}
          icon={<Ticket />}
        />

        <StatCard
          title="Active Coupons"
          value={activeCoupons}
          icon={<CheckCircle2 />}
        />

        <StatCard
          title="Expired Coupons"
          value={expiredCoupons}
          icon={<XCircle />}
        />

      </div>

      {/* ================= HEADER ================= */}

      <div className="flex justify-between items-center">

        <h2 className="text-xl font-bold">
          Coupon Management
        </h2>

        <button
          onClick={() => {
            setEditingCoupon(null);
            setDrawerOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          + New Coupon
        </button>

      </div>

      {/* ================= TABLE ================= */}

      <div className="bg-white rounded-xl shadow overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-slate-50 border-b">

            <tr>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                Code
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                Type
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                Value
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                Expiry
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                Applicability
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                Module / Min
              </th>

              <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-400">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {coupons.map((coupon) => (

              <tr key={coupon.code} className="border-t">

                <td className="px-6 py-4 font-semibold">
                  {coupon.code}
                </td>

                <td className="px-6 py-4">
                  {coupon.type}
                </td>

                <td className="px-6 py-4">
                  {coupon.type === "percent"
                    ? `${coupon.value}%`
                    : `₹${coupon.value}`}
                </td>

                <td className="px-6 py-4">
                  {coupon.expiry.slice(0, 10)}
                </td>

                <td className="px-6 py-4">
                  {coupon.applicability ?? "all"}
                </td>

                <td className="px-6 py-4">
                  {coupon.applicability === "single"
                    ? coupon.moduleId || "Any Single"
                    : coupon.applicability === "min_modules"
                    ? `>= ${coupon.minModules}`
                    : "All"}
                </td>

                <td className="px-6 py-4 text-right space-x-3">

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
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
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

/* ================= STAT CARD ================= */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">

      <div className="text-blue-600 text-2xl">
        {icon}
      </div>

      <div>

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <p className="text-2xl font-bold">
          {value}
        </p>

      </div>

    </div>
  );
}