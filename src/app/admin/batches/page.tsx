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
  status?: string; // Active / Upcoming / Closed
};

export default function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [level, setLevel] = useState("ACCA Skills");
  const [batchType, setBatchType] = useState("Weekdays");
  const [batchName, setBatchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
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
      setBatches(data || []);
    } catch (err: any) {
      console.error("LOAD BATCHES ERROR:", err);
      alert("Could not load batches. Check console for details.");
    } finally {
      setFetching(false);
    }
  };

  const openCreateModal = () => {
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
    setLevel(batch.level);
    setBatchType(batch.type);
    setBatchName(batch.name);
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
      await loadBatches();
    } catch (err: any) {
      console.error("DELETE BATCH ERROR:", err);
      alert("Failed to delete batch. See console for details.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const visibleBatches = batches.filter((b) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.level.toLowerCase().includes(q) ||
      b.type.toLowerCase().includes(q)
    );
  });

  /* pagination calc */
  const totalItems = visibleBatches.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = visibleBatches.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} /> Create New Batch
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">General Info</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Schedule & Date</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Occupancy</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Manage</th>
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
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ background: "#FDE68A" }}>
                            {batch.name ? batch.name.charAt(0).toUpperCase() : "B"}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight">{batch.name}</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">{batch.level}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
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

                      {/* STATUS */}
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          {batch.status || "Active"}
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        <div className="text-sm font-black">{current} / {max}</div>
                      </td>

                      <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(batch)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg">
                          <Edit size={18} />
                        </button>

                        <button
                          onClick={() => deleteBatch(batch.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 rounded-lg"
                        >
                          {actionLoadingId === batch.id ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Trash size={18} />
                          )}
                        </button>

                        <button className="p-2 text-slate-300 hover:text-indigo-600">
                          <MoreVertical size={18} />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>
          </table>

          {/* pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
            <div className="text-sm text-slate-500">
              Showing {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, totalItems)} of {totalItems}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border text-sm disabled:opacity-40"
              >
                Prev
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
