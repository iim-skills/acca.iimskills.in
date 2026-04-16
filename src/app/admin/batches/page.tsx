"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Calendar1,
  Users,
  X,
  Loader2,
  MoreVertical,
  Search,
  Edit,
  Trash,
  Clock1,
  ChevronDown,
  Check,
} from "lucide-react";

type Batch = {
  id: string;
  name: string;
  level: string;
  type: string; // Weekend / Weekdays
  startDate: string; // YYYY-MM-DD
  maxStudents: number;
  currentStudents: number;
  status?: string; // Active / Upcoming / Closed
};

type BatchFormState = {
  name: string;
  level: string;
  type: string;
  startDate: string;
  maxStudents: string;
};

const initialForm: BatchFormState = {
  name: "",
  level: "ACCA Skills",
  type: "Weekdays",
  startDate: "",
  maxStudents: "",
};

export default function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [form, setForm] = useState<BatchFormState>(initialForm);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  /* pagination */
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/batches");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch batches");
      }
      const data: Batch[] = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD BATCHES ERROR:", err);
      alert("Could not load batches. Check console for details.");
    } finally {
      setFetching(false);
    }
  };

  const openCreateModal = () => {
    setEditingBatchId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (batch: Batch) => {
    setEditingBatchId(batch.id);
    setForm({
      name: batch.name || "",
      level: batch.level || "ACCA Skills",
      type: batch.type || "Weekdays",
      startDate: batch.startDate ? batch.startDate.slice(0, 10) : "",
      maxStudents: String(batch.maxStudents ?? ""),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        level: form.level,
        type: form.type,
        startDate: form.startDate,
        maxStudents: Number.parseInt(form.maxStudents || "0", 10),
      };

      let res: Response;

      if (editingBatchId) {
        res = await fetch(`/api/admin/batches/${editingBatchId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "API error");
      }

      await loadBatches();
      setIsModalOpen(false);
      setEditingBatchId(null);
      setForm(initialForm);
    } catch (err) {
      console.error("CREATE/EDIT ERROR:", err);
      alert("Failed to save batch. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const deleteBatch = async (id: string) => {
    const confirmed = confirm("Delete this batch? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/admin/batches/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to delete");
      }
      await loadBatches();
    } catch (err) {
      console.error("DELETE BATCH ERROR:", err);
      alert("Failed to delete batch. See console for details.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const visibleBatches = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return batches;

    return batches.filter((b) => {
      return (
        b.name.toLowerCase().includes(q) ||
        b.level.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        (b.status || "").toLowerCase().includes(q)
      );
    });
  }, [batches, searchTerm]);

  /* pagination calc */
  const totalItems = visibleBatches.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = visibleBatches.slice(startIndex, startIndex + PAGE_SIZE);

  const stats = useMemo(() => {
    const active = batches.filter((b) => (b.status || "Active").toLowerCase() === "active").length;
    const upcoming = batches.filter((b) => (b.status || "").toLowerCase() === "upcoming").length;
    const closed = batches.filter((b) => (b.status || "").toLowerCase() === "closed").length;
    return { active, upcoming, closed };
  }, [batches]);

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 font-sans overflow-x-hidden">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          

          {/* Search + CTA in one row */}
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1 min-w-0 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search batches..."
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={openCreateModal}
              className="shrink-0 inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] text-sm sm:text-base min-h-[44px]"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Create New Batch</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard title="Total Batches" value={batches.length} />
          <StatCard title="Active" value={stats.active} />
          <StatCard title="Upcoming" value={stats.upcoming} />
          <StatCard title="Closed" value={stats.closed} />
        </div>

        {/* Content */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="flex flex-col justify-between gap-4 border-b border-gray-50 p-6 md:flex-row md:items-center bg-white rounded-t-[2rem] border border-slate-200/60 border-b-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Batch Management</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search batches..."
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
               onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              <span>New Quiz</span>
            </button>
          </div>
        </div>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    General Info
                  </th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Schedule & Date
                  </th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Status
                  </th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Occupancy
                  </th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                    Manage
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {fetching ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400">
                      No batches yet. Create a new batch to get started.
                    </td>
                  </tr>
                ) : (
                  paginated.map((batch) => {
                    const current = Number(batch.currentStudents || 0);
                    const max = Math.max(1, Number(batch.maxStudents || 1));

                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-slate-900 font-black text-sm shadow-sm"
                              style={{ background: "#FDE68A" }}
                            >
                              {batch.name ? batch.name.charAt(0).toUpperCase() : "B"}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 leading-tight">
                                {batch.name}
                              </p>
                              <p className="text-xs text-slate-500 font-medium mt-1">
                                {batch.level}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Clock1 size={16} className="text-slate-400" />
                              <span className="text-sm font-semibold text-slate-700">
                                {batch.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar1 size={15} className="text-slate-400" />
                              <span className="text-sm text-slate-400">
                                {new Date(batch.startDate).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full border ${
                              (batch.status || "Active").toLowerCase() === "active"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : (batch.status || "").toLowerCase() === "upcoming"
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {batch.status || "Active"}
                          </span>
                        </td>

                        <td className="px-8 py-6">
                          <div className="text-sm font-black text-slate-900">
                            {current} / {max}
                          </div>
                        </td>

                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(batch)}
                              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit size={18} />
                            </button>

                            <button
                              onClick={() => deleteBatch(batch.id)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              {actionLoadingId === batch.id ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                <Trash size={18} />
                              )}
                            </button>

                            <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors">
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {fetching ? (
              <div className="py-20 text-center">
                <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                <p className="text-slate-400 text-sm mt-3">Loading batches...</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="py-16 text-center text-slate-400 px-6">
                No batches yet. Create a new batch to get started.
              </div>
            ) : (
              paginated.map((batch) => {
                const current = Number(batch.currentStudents || 0);
                const max = Math.max(1, Number(batch.maxStudents || 1));

                return (
                  <div key={batch.id} className="p-4 sm:p-5 active:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-slate-900 font-black text-sm shrink-0"
                          style={{ background: "#FDE68A" }}
                        >
                          {batch.name ? batch.name.charAt(0).toUpperCase() : "B"}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                            {batch.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 truncate">{batch.level}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(batch)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => deleteBatch(batch.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        >
                          {actionLoadingId === batch.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Trash size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Type
                        </p>
                        <p className="text-sm font-semibold text-slate-700 mt-1">{batch.type}</p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Start Date
                        </p>
                        <p className="text-sm font-semibold text-slate-700 mt-1">
                          {new Date(batch.startDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Status
                        </p>
                        <span
                          className={`inline-flex mt-1 px-3 py-1 text-[11px] font-bold rounded-full border ${
                            (batch.status || "Active").toLowerCase() === "active"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : (batch.status || "").toLowerCase() === "upcoming"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {batch.status || "Active"}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Occupancy
                        </p>
                        <p className="text-sm font-black text-slate-900 mt-1">
                          {current} / {max}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t bg-slate-50">
            <div className="text-sm text-slate-500">
              Showing {totalItems === 0 ? 0 : startIndex + 1} -{" "}
              {Math.min(startIndex + PAGE_SIZE, totalItems)} of {totalItems}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                Prev
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {editingBatchId ? "Edit Batch" : "Create Batch"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {editingBatchId ? "Update the batch details below." : "Add a new batch below."}
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <Field label="Batch Name">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="e.g. ACCA Weekday Morning Batch"
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Level">
                  <input
                    type="text"
                    value={form.level}
                    onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="e.g. ACCA Skills"
                    required
                  />
                </Field>

                <Field label="Batch Type">
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 bg-white"
                    required
                  >
                    <option value="Weekdays">Weekdays</option>
                    <option value="Weekend">Weekend</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Start Date">
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                    required
                  />
                </Field>

                <Field label="Max Students">
                  <input
                    type="number"
                    value={form.maxStudents}
                    onChange={(e) => setForm((p) => ({ ...p, maxStudents: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="e.g. 25"
                    min={1}
                    required
                  />
                </Field>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-60 text-sm"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  {editingBatchId ? "Update Batch" : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-2">{label}</span>
      {children}
    </label>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-[1.5rem] shadow-sm border border-slate-200/60">
      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {title}
      </p>
      <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mt-2">
        {value}
      </p>
    </div>
  );
}