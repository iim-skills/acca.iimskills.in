"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, CheckCircle2, XCircle, X, Edit3, Trash2, Plus } from "lucide-react";

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
  const [saving, setSaving] = useState(false);

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
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
      setCoupons([]);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  /* ================= STATS ================= */

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => new Date(c.expiry) >= new Date()).length;
  const expiredCoupons = coupons.filter((c) => new Date(c.expiry) < new Date()).length;

  /* ================= FORM HELPERS ================= */

  function openCreateDrawer() {
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
    setDrawerOpen(true);
  }

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

  /* ================= SUBMIT ================= */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

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

    try {
      const res = await fetch("/api/admin/coupons", {
        method: editingCoupon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to save coupon");
        return;
      }

      await fetchCoupons();
      setDrawerOpen(false);
      setEditingCoupon(null);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  /* ================= DELETE ================= */

  async function handleDelete(code: string) {
    if (!confirm("Delete coupon?")) return;

    try {
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete coupon");
        return;
      }

      await fetchCoupons();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  }

  const formatExpiry = (expiry?: string) => {
    if (!expiry) return "-";
    const d = new Date(expiry);
    if (Number.isNaN(d.getTime())) return expiry.slice(0, 10);
    return d.toLocaleDateString();
  };

  const isExpired = (coupon: Coupon) => new Date(coupon.expiry) < new Date();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ================= TOP STATS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        <StatCard title="Total Coupons" value={totalCoupons} icon={<Ticket />} />
        <StatCard title="Active Coupons" value={activeCoupons} icon={<CheckCircle2 />} />
        <StatCard title="Expired Coupons" value={expiredCoupons} icon={<XCircle />} />
      </div>

      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Coupon Management</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create, edit, and manage discount coupons.
          </p>
        </div>

        <button
          onClick={openCreateDrawer}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors w-full sm:w-auto"
        >
          <Plus size={18} />
          New Coupon
        </button>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-400">Code</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-400">Type</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-400">Value</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-400">Expiry</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-400">
                  Applicability
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-400">
                  Module / Min
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr
                    key={coupon.code}
                    className={`border-t border-slate-100 ${isExpired(coupon) ? "bg-rose-50/30" : ""}`}
                  >
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{coupon.code}</span>
                        {isExpired(coupon) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-bold">
                            Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-700">{coupon.type}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {coupon.type === "percent" ? `${coupon.value}%` : `₹${coupon.value}`}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{formatExpiry(coupon.expiry)}</td>
                    <td className="px-5 py-4 capitalize text-slate-700">
                      {coupon.applicability ?? "all"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {coupon.applicability === "single"
                        ? coupon.moduleId || "Any Single"
                        : coupon.applicability === "min_modules"
                        ? `>= ${coupon.minModules ?? 0}`
                        : "All"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.code)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {coupons.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-500">
            No coupons found.
          </div>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon.code}
              className={`bg-white border border-slate-100 rounded-2xl p-4 shadow-sm ${isExpired(coupon) ? "ring-1 ring-rose-100" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900">{coupon.code}</h3>
                    {isExpired(coupon) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-bold">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 capitalize mt-1">
                    {coupon.type} • {coupon.applicability ?? "all"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {coupon.type === "percent" ? `${coupon.value}%` : `₹${coupon.value}`}
                  </p>
                  <p className="text-xs text-slate-500">{formatExpiry(coupon.expiry)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Module / Min
                  </p>
                  <p className="font-medium text-slate-700 mt-1">
                    {coupon.applicability === "single"
                      ? coupon.moduleId || "Any Single"
                      : coupon.applicability === "min_modules"
                      ? `>= ${coupon.minModules ?? 0}`
                      : "All"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Notes
                  </p>
                  <p className="font-medium text-slate-700 mt-1 line-clamp-2">
                    {coupon.notes || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(coupon)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(coupon.code)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-semibold"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= DRAWER ================= */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 p-4 sm:p-6 overflow-y-auto sm:rounded-l-2xl"
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Fill in the details below to save the coupon.
                  </p>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                  aria-label="Close drawer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Coupon Code
                  </label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="Coupon Code"
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-3 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          type: e.target.value as "percent" | "fixed",
                        })
                      }
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-3 rounded-xl bg-white"
                    >
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Value
                    </label>
                    <input
                      required
                      type="number"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      placeholder="Value"
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-3 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Expiry
                  </label>
                  <input
                    required
                    type="date"
                    value={form.expiry}
                    onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-3 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Applicability
                  </label>
                  <select
                    value={form.applicability}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        applicability: e.target.value as "all" | "single" | "min_modules",
                      })
                    }
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-3 rounded-xl bg-white"
                  >
                    <option value="all">All Courses / Modules</option>
                    <option value="single">Single Module</option>
                    <option value="min_modules">Minimum Modules</option>
                  </select>
                </div>

                {form.applicability === "single" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Module ID
                    </label>
                    <input
                      value={form.moduleId}
                      onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                      placeholder="Module ID"
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-3 rounded-xl"
                    />
                  </div>
                )}

                {form.applicability === "min_modules" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Minimum Modules
                    </label>
                    <input
                      type="number"
                      value={form.minModules}
                      onChange={(e) => setForm({ ...form, minModules: e.target.value })}
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-3 rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Notes
                  </label>
                  <textarea
                    placeholder="Notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-3 rounded-xl min-h-[110px] resize-y"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold"
                  >
                    {saving ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
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
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className="text-blue-600 text-2xl shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}