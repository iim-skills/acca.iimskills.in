"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Users,
  Layers,
  X,
  Loader2,
  ArrowRight,
  Clock,
  MoreVertical,
  Filter,
  Search,
  Edit,
  Trash,
  Clock1,
  Calendar1,
} from "lucide-react";

type Batch = {
  id: string;
  name: string;
  level: string;
  type: string; // Weekend / Weekdays
  startDate: string; // YYYY-MM-DD
  maxStudents: number;
  currentStudents: number;
};

export default function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // for form submit
  const [fetching, setFetching] = useState(true); // for initial load / table
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null); // for per-row actions

  // Form State
  const [level, setLevel] = useState("ACCA Skills");
  const [batchType, setBatchType] = useState("Weekdays");
  const [batchName, setBatchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

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
      setBatches(data || []);
    } catch (err: any) {
      console.error("LOAD BATCHES ERROR:", err);
      alert("Could not load batches. Check console for details.");
    } finally {
      setFetching(false);
    }
  };

  const openCreateModal = () => {
    // reset form for creation
    setEditingBatchId(null);
    setLevel("ACCA Skills");
    setBatchType("Weekdays");
    setBatchName("");
    setStartDate("");
    setMaxStudents("");
    setIsModalOpen(true);
  };

  const openEditModal = (batch: Batch) => {
    setEditingBatchId(batch.id);
    // Prefill form
    setLevel(batch.level);
    setBatchType(batch.type);
    setBatchName(batch.name);
    // Ensure date is YYYY-MM-DD
    setStartDate(batch.startDate ? batch.startDate.slice(0, 10) : "");
    setMaxStudents(String(batch.maxStudents));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: batchName,
        level,
        type: batchType,
        startDate,
        maxStudents: Number.parseInt(maxStudents || "0", 10),
      };

      let res: Response;
      if (editingBatchId) {
        // Edit existing
        res = await fetch(`/api/admin/batches/${editingBatchId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
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
      // clear
      setEditingBatchId(null);
      setBatchName("");
      setStartDate("");
      setMaxStudents("");
    } catch (err: any) {
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
      // refresh
      await loadBatches();
    } catch (err: any) {
      console.error("DELETE BATCH ERROR:", err);
      alert("Failed to delete batch. See console for details.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered list using searchTerm
  const visibleBatches = batches.filter((b) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.level.toLowerCase().includes(q) ||
      b.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 font-sans">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Batch Management</h1>
          <p className="text-slate-500 text-sm">Organize schedules and monitor student occupancy rates.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search batches..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all text-sm">
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} />
            Create New Batch
          </button>
        </div>
      </div>

      {/* Main List Table */}
      <div className="max-w-6xl mx-auto mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">General Info</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Schedule & Date</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Occupancy</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fetching ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                  </td>
                </tr>
              ) : visibleBatches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 text-center text-slate-400">
                    No batches yet. Create a new batch to get started.
                  </td>
                </tr>
              ) : (
                visibleBatches.map((batch) => {
                  const current = Number(batch.currentStudents || 0);
                  const max = Math.max(1, Number(batch.maxStudents || 1));
                  const percent = Math.min(100, Math.round((current / max) * 100));
                  const bluePct = Math.min(percent, 50); // blue covers up to 50%
                  const redPct = Math.max(0, percent - 50); // red covers anything beyond 50%

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/40 transition-colors group">
                      {/* General Info */}
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          {/* Circle avatar with initial */}
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                            style={{ background: "#FDE68A" }}
                          >
                            {batch.name ? batch.name.charAt(0).toUpperCase() : "B"}
                          </div>

                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight">{batch.name}</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">{batch.level}</p>
                          </div>
                        </div>
                      </td>

                      {/* Schedule & Date */}
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center justify-start gap-2">
                          <div className="flex items-center gap-2">
                            <Clock1 size={16} className="text-slate-400" />
                            <span className="text-sm font-semibold text-slate-700">{batch.type}</span>
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

                      {/* Occupancy / Two-tone Progress Bar */}

                       
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-end">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                          <div className="text-[10px] uppercase font-extrabold tracking-wide text-rose-500 mb-2">
                            Total Enrolled
                          </div>
                             <div
                              className={`text-sm font-black min-w-16 text-right ${
                                percent <= 50 ? "text-blue-600" : "text-rose-600"
                              }`}
                            >
                              {current} / {max}
                            </div>
                         </div>
                          {/* two-tone progress row */}
                          <div className="w-48 flex items-center gap-4">
                            <div className="flex-1">
                              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                                {/* Blue part (left) */}
                                {bluePct > 0 && (
                                  <div
                                    className="h-3 bg-blue-500 absolute left-0 top-0 rounded-l-full"
                                    style={{ width: `${bluePct}%` }}
                                  />
                                )}

                                {/* Red part (right) */}
                                {redPct > 0 && (
                                  <div
                                    className="h-3 bg-rose-500 absolute left-0 top-0 rounded-r-full"
                                    style={{
                                      left: `${bluePct}%`,
                                      width: `${redPct}%`,
                                    }}
                                  />
                                )}
                              </div>
                            </div>

                            {/* numeric with conditional color: both numbers blue if <=50%, else both red */}
                             
                          </div>

                          {/* optional percentage label */}
                           
                        </div>
                      </td>

                      {/* Manage (buttons stay as-is) */}
                      <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(batch)}
                          className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg"
                          title="Edit"
                          disabled={actionLoadingId === batch.id}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteBatch(batch.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 rounded-lg"
                          title="Delete"
                          disabled={actionLoadingId === batch.id}
                        >
                          {actionLoadingId === batch.id ? <Loader2 className="animate-spin" size={18} /> : <Trash size={18} />}
                        </button>
                        <button className="p-2 text-slate-300 hover:text-indigo-600" title="More">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-6 md:p-10 text-white flex justify-between items-center">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight italic">{editingBatchId ? "Edit Batch" : "New Intake"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
              {/* ACCA Level */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Academic Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Knowledge", "Skills", "Professional"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(`ACCA ${lvl}`)}
                      className={`py-3 md:py-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${
                        level === `ACCA ${lvl}` ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-50 text-slate-400"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Batch Type - Weekend/Weekdays */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Schedule Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Weekdays", "Weekend"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBatchType(t)}
                      className={`py-3 md:py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all border-2 ${
                        batchType === t ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md" : "border-slate-50 text-slate-400"
                      }`}
                    >
                      <Clock size={14} /> {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Batch Label</label>
                <input
                  required
                  placeholder="e.g. April 2026 Skills Morning"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 transition-all outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Kickoff Date</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 transition-all outline-none font-bold text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Total Seats</label>
                  <input
                    required
                    type="number"
                    min={1}
                    placeholder="30"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 transition-all outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    {editingBatchId ? "Save Changes" : "Finalize Batch"} <ArrowRight size={18} strokeWidth={3} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
