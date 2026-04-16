"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  CheckCircle2,
  XCircle,
  X,
  Edit3,
  Trash2,
  Plus,
  Search,
  Calendar,
  Percent,
  CircleDollarSign,
  Info,
} from "lucide-react";

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
  const [search, setSearch] = useState("");

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

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => new Date(c.expiry) >= new Date()).length;
  const expiredCoupons = coupons.filter((c) => new Date(c.expiry) < new Date()).length;

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

      if (!res.ok) {
        alert("Failed to save coupon");
        return;
      }

      await fetchCoupons();
      setDrawerOpen(false);
      setEditingCoupon(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(code: string) {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    await fetch(`/api/admin/coupons?code=${code}`, { method: "DELETE" });
    await fetchCoupons();
  }

  const formatExpiry = (expiry?: string) =>
    expiry ? new Date(expiry).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "-";

  const isExpired = (coupon: Coupon) => new Date(coupon.expiry) < new Date();

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <button
          onClick={openCreateDrawer}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-semibold shadow-sm transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>New Coupon</span>
        </button>
         <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by coupon code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-sm pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all text-sm"
        />
      </div>
       
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total" value={totalCoupons} icon={<Ticket className="text-blue-600" />} />
        <StatCard title="Active" value={activeCoupons} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard title="Expired" value={expiredCoupons} icon={<XCircle className="text-rose-500" />} />
      </div>

      {/* FILTERS & SEARCH */}
    

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Code</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Value</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Expiry</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Ticket size={32} className="text-slate-300" />
                      </div>
                      <p className="text-base font-medium">No coupons found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => (
                  <tr key={c.code} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-xs">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-600">
                      <div className="flex items-center gap-2">
                        {c.type === 'percent' ? <Percent size={14} /> : <CircleDollarSign size={14} />}
                        {c.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {c.type === "percent" ? `${c.value}%` : `₹${c.value}`}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {formatExpiry(c.expiry)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isExpired(c) ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600">
                          <XCircle size={12} /> Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.code)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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

      {/* DRAWER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Configure discount parameters</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Coupon Code</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="E.g. SAVE50"
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Type</label>
                    <select
                      className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-400 bg-white"
                      value={form.type}
                      onChange={(e: any) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Value</label>
                    <input
                      required
                      type="number"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      placeholder="0"
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:border-blue-400 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expiry Date</label>
                  <input
                    required
                    type="date"
                    value={form.expiry}
                    onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:border-blue-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notes (Internal)</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Add a reason or description..."
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:border-blue-400 outline-none resize-none text-sm"
                  />
                </div>
              </form>

              <div className="p-6 border-t border-slate-100">
                <button 
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
                </button>
              </div>
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
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-colors">
      <div className="p-3 bg-slate-50 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-tight">{title}</p>
        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}