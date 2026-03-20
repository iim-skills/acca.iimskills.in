"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  User,
  Mail,
  BookOpen,
  Users,
  FileText,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  Edit,
  MoreVertical,
  ChevronDown,
} from "lucide-react";

/* ================= TYPES ================= */
type DateGroup = {
  date: string;
  times: string[];
};

type SlotTime = {
  time: string;
  capacity: number;
  booked: number;
};

type SlotRow = {
  id: number;
  mentor_name: string;
  mentor_email: string;
  course_id?: string;
  notes?: string;
  meeting_url?: string;
  slot_start: string;
  slot_times: SlotTime[];
  isActive?: number | boolean;
};

type MsgState =
  | { type: ""; text: "" }
  | { type: "success"; text: string }
  | { type: "error"; text: string };

const DEFAULT_CAPACITY = 30;

export default function AdminMentorSlotsPage() {
  const [mentorName, setMentorName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [capacity, setCapacity] = useState<number>(DEFAULT_CAPACITY);
  const [notes, setNotes] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [editingRow, setEditingRow] = useState<SlotRow | null>(null);

  const [groups, setGroups] = useState<DateGroup[]>([{ date: "", times: ["17:00"] }]);

  const [rows, setRows] = useState<SlotRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<MsgState>({ type: "", text: "" });
  const [panelOpen, setPanelOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  /* ================= LOAD SLOT LIST ================= */
  const loadSlots = async () => {
    try {
      const res = await fetch("/api/admin/mentor_slots");
      const json = await res.json();
      setRows(Array.isArray(json.rows) ? json.rows : []);
    } catch (e) {
      console.error("Load slots error", e);
      setMessage({ type: "error", text: "Failed to load slots" });
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  /* ================= HELPERS ================= */
  const resetForm = () => {
    setEditingRow(null);
    setMentorName("");
    setMentorEmail("");
    setCourseId("");
    setCapacity(DEFAULT_CAPACITY);
    setNotes("");
    setMeetingUrl("");
    setGroups([{ date: "", times: ["17:00"] }]);
  };

  const openCreateSession = () => {
    resetForm();
    setPanelOpen(true);
  };

  const openEditSession = (row: SlotRow) => {
    setEditingRow(row);

    setMentorName(row.mentor_name || "");
    setMentorEmail(row.mentor_email || "");
    setCourseId(row.course_id || "");
    setNotes(row.notes || "");
    setMeetingUrl(row.meeting_url || "");
    setCapacity(row.slot_times?.[0]?.capacity || DEFAULT_CAPACITY);

    setGroups([
      {
        date: row.slot_start?.split("T")[0] || "",
        times:
          row.slot_times?.map((t) => {
            const raw = String(t.time || "");
            return raw.replace(/:00$/, "").slice(0, 5);
          }) || [""],
      },
    ]);

    setPanelOpen(true);
  };

  const deleteSession = async (id: number) => {
    if (!confirm("Delete this session?")) return;

    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/admin/mentor_slots/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to delete");
      }

      await loadSlots();
      setMessage({ type: "success", text: "Session deleted successfully" });
    } catch (err) {
      console.error("Delete session error", err);
      setMessage({ type: "error", text: "Error deleting session" });
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ================= GROUP HANDLERS ================= */
  const addDateGroup = () => {
    setGroups((g) => [...g, { date: "", times: ["17:00"] }]);
  };

  const removeDateGroup = (idx: number) => {
    setGroups((g) => g.filter((_, i) => i !== idx));
  };

  const updateDate = (idx: number, val: string) => {
    setGroups((g) => g.map((v, i) => (i === idx ? { ...v, date: val } : v)));
  };

  const addTime = (idx: number) => {
    setGroups((g) =>
      g.map((v, i) => (i === idx ? { ...v, times: [...v.times, ""] } : v))
    );
  };

  const updateTime = (gIdx: number, tIdx: number, val: string) => {
    setGroups((g) =>
      g.map((v, i) =>
        i === gIdx
          ? {
              ...v,
              times: v.times.map((t, j) => (j === tIdx ? val : t)),
            }
          : v
      )
    );
  };

  const removeTime = (gIdx: number, tIdx: number) => {
    setGroups((g) =>
      g.map((v, i) =>
        i === gIdx ? { ...v, times: v.times.filter((_, j) => j !== tIdx) } : v
      )
    );
  };

  /* ================= SAVE ================= */
  const handleCreate = async () => {
    if (!mentorName.trim()) {
      setMessage({ type: "error", text: "Mentor name is required" });
      return;
    }

    if (!mentorEmail.trim()) {
      setMessage({ type: "error", text: "Mentor email is required" });
      return;
    }

    setCreating(true);
    setMessage({ type: "", text: "" });

    try {
      const validGroups = groups.filter((group) => group.date && group.times.some((t) => t));

      if (validGroups.length === 0) {
        setMessage({ type: "error", text: "Add at least one date and time" });
        return;
      }

      for (const group of validGroups) {
        const slots = group.times
          .filter(Boolean)
          .map((time) => ({
            time: `${time.length === 5 ? time : time.slice(0, 5)}:00`,
            capacity: Number(capacity || 1),
          }));

        if (!slots.length) continue;

        const payload = {
          mentorName,
          mentorEmail,
          courseId,
          slotDate: group.date,
          meetingUrl,
          slots,
          notes,
          isActive: 1,
        };

        const res = editingRow
          ? await fetch(`/api/admin/mentor_slots/${editingRow.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch("/api/admin/mentor_slots", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed");
      }

      setMessage({
        type: "success",
        text: editingRow ? "Session updated successfully" : "Slots created successfully",
      });

      await loadSlots();

      setTimeout(() => {
        setPanelOpen(false);
        resetForm();
        setMessage({ type: "", text: "" });
      }, 1200);
    } catch (err) {
      console.error("Save slot error", err);
      setMessage({ type: "error", text: "Error saving slots" });
    } finally {
      setCreating(false);
    }
  };

  /* ================= FILTER ================= */
  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const dateText = r.slot_start?.split("T")[0] || "";
      const timesText = (r.slot_times || []).map((t) => t.time).join(" ");
      return (
        r.mentor_name?.toLowerCase().includes(q) ||
        r.mentor_email?.toLowerCase().includes(q) ||
        (r.course_id || "").toLowerCase().includes(q) ||
        dateText.toLowerCase().includes(q) ||
        timesText.toLowerCase().includes(q) ||
        (r.notes || "").toLowerCase().includes(q)
      );
    });
  }, [rows, searchTerm]);

  /* ================= STATS ================= */
  const totalCapacity = useMemo(() => {
    return rows.reduce((acc, curr) => {
      const rowCap =
        curr.slot_times?.reduce((s, t) => s + (Number(t.capacity) || 0), 0) || 0;
      return acc + rowCap;
    }, 0);
  }, [rows]);

  const mentorCount = useMemo(() => {
    return new Set(rows.map((r) => r.mentor_name).filter(Boolean)).size;
  }, [rows]);

  const totalSlots = useMemo(() => {
    return rows.reduce((acc, curr) => acc + (curr.slot_times?.length || 0), 0);
  }, [rows]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
        {/* HEADER */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
           

          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1 min-w-0 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                size={16}
              />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                placeholder="Search mentors..."
              />
            </div>

            <button
              onClick={openCreateSession}
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] text-sm sm:text-base min-h-[44px]"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">
                {editingRow ? "Update Session" : "Create Mentor Slots"}
              </span>
              <span className="sm:hidden">{editingRow ? "Update" : "Create"}</span>
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard label="Active Sessions" value={rows.length} icon={<Calendar />} />
          <StatCard label="Total Capacity" value={totalCapacity} icon={<Users />} />
          <StatCard label="Mentors Listed" value={mentorCount} icon={<User />} />
          <StatCard label="Total Time Slots" value={totalSlots} icon={<Clock />} />
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-50 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-900 text-lg">Current Availability</h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage mentor sessions, meeting links, and slot occupancy.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
              <span className="px-3 py-1 rounded-full bg-slate-100 font-semibold">
                {filteredRows.length} results
              </span>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Mentor / Course</th>
                  <th className="px-6 py-4">Session Date</th>
                  <th className="px-6 py-4">Slots & Links</th>
                  <th className="px-6 py-4">Availability</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td className="p-12 text-center text-slate-400" colSpan={5}>
                      <div className="flex flex-col items-center gap-2 opacity-60">
                        <Calendar size={48} strokeWidth={1.5} />
                        <p className="font-medium">No slots have been created yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-base">
                            {r.mentor_name}
                          </span>
                          <span className="text-slate-400 text-xs font-medium flex items-center gap-1 mt-1">
                            <Mail size={12} /> {r.mentor_email}
                          </span>
                          {r.course_id ? (
                            <span className="text-[11px] text-indigo-600 font-semibold mt-1">
                              Course: {r.course_id}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-xs uppercase tracking-tight">
                          <Calendar size={12} />
                          {r.slot_start?.split("T")[0] || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {r.slot_times?.map((t, i) => (
                            <div key={i} className="flex items-center gap-1 group/item">
                              <span className="text-[11px] font-bold border border-slate-200 bg-white px-2 py-0.5 rounded-md text-slate-600 shadow-sm">
                                {String(t.time || "").replace(/:00$/, "")}
                              </span>
                              {r.meeting_url ? (
                                <a
                                  href={r.meeting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                  title="Join Meeting"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {r.slot_times?.map((t, i) => {
                            const left = Math.max(0, t.capacity - (t.booked || 0));
                            const percent = t.capacity
                              ? Math.min(100, ((t.booked || 0) / t.capacity) * 100)
                              : 0;

                            return (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${left === 0 ? "bg-red-400" : "bg-emerald-400"}`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[10px] font-black uppercase ${
                                    left === 0 ? "text-red-500" : "text-slate-500"
                                  }`}
                                >
                                  {left} Left
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditSession(r)}
                            className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 font-semibold text-xs"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteSession(r.id)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg text-xs"
                          >
                            {actionLoadingId === r.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              "Delete"
                            )}
                          </button>

                          <a
                            href={`/api/admin/mentor_slots/${r.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg text-xs"
                          >
                            Download
                          </a>

                          <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-slate-50 rounded-lg">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredRows.length === 0 ? (
              <div className="py-16 text-center text-slate-400 px-6">
                No slots have been created yet.
              </div>
            ) : (
              filteredRows.map((r) => (
                <div key={r.id} className="p-4 sm:p-5 active:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                        {r.mentor_name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
                        <Mail size={12} /> {r.mentor_email}
                      </p>
                      <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                        {r.course_id ? `Course: ${r.course_id}` : "No course ID"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditSession(r)}
                        className="px-3 py-2 rounded-lg text-indigo-600 hover:bg-indigo-50 text-xs font-semibold border border-indigo-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSession(r.id)}
                        className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold border border-red-100"
                      >
                        {actionLoadingId === r.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Session Date
                      </p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        {r.slot_start?.split("T")[0] || "—"}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Meeting Link
                      </p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        {r.meeting_url ? "Available" : "—"}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Time Slots
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {r.slot_times?.map((t, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] font-bold border border-slate-200 bg-white px-2.5 py-1 rounded-md text-slate-600"
                          >
                            {String(t.time || "").replace(/:00$/, "")}
                            {r.meeting_url ? <ExternalLink size={11} /> : null}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Availability
                      </p>
                      <div className="space-y-2 mt-2">
                        {r.slot_times?.map((t, i) => {
                          const left = Math.max(0, t.capacity - (t.booked || 0));
                          const percent = t.capacity
                            ? Math.min(100, ((t.booked || 0) / t.capacity) * 100)
                            : 0;

                          return (
                            <div key={i} className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${left === 0 ? "bg-red-400" : "bg-emerald-400"}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-black uppercase text-slate-500">
                                {left} Left
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-end">
                      <a
                        href={`/api/admin/mentor_slots/${r.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100"
                      >
                        <ExternalLink size={14} /> Download
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CREATION / EDIT DRAWER */}
        <AnimatePresence>
          {panelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setPanelOpen(false);
                  resetForm();
                }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              />

              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col"
              >
                <div className="p-6 sm:p-8 bg-indigo-600 text-white shrink-0 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Calendar size={120} />
                  </div>

                  <div className="relative z-10 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight">
                        {editingRow ? "Edit Session" : "Create Session"}
                      </h3>
                      <p className="text-indigo-100 text-sm opacity-90 font-medium">
                        Add new mentor availability blocks.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setPanelOpen(false);
                        resetForm();
                      }}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 space-y-8 bg-white rounded-t-3xl -mt-5 relative z-20 shadow-2xl">
                  {/* Mentor details */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-1 bg-indigo-600 rounded-full" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Primary Information
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <Field label="Mentor Name" icon={<User size={12} />}>
                        <input
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
                          placeholder="e.g. Dr. Sarah Chen"
                          value={mentorName}
                          onChange={(e) => setMentorName(e.target.value)}
                        />
                      </Field>

                      <Field label="Mentor Email" icon={<Mail size={12} />}>
                        <input
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
                          placeholder="sarah@university.edu"
                          value={mentorEmail}
                          onChange={(e) => setMentorEmail(e.target.value)}
                        />
                      </Field>

                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Course ID" icon={<BookOpen size={12} />}>
                          <input
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                            placeholder="CS-101"
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                          />
                        </Field>

                        <Field label="Capacity" icon={<Users size={12} />}>
                          <input
                            type="number"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold"
                            value={capacity}
                            onChange={(e) => setCapacity(Number(e.target.value))}
                          />
                        </Field>
                      </div>

                      <Field label="Meeting URL" icon={<LinkIcon size={12} />}>
                        <input
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-medium text-indigo-600"
                          placeholder="https://zoom.us/j/..."
                          value={meetingUrl}
                          onChange={(e) => setMeetingUrl(e.target.value)}
                        />
                      </Field>

                      <Field label="Private Notes" icon={<FileText size={12} />}>
                        <input
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                          placeholder="Optional instructions..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Schedule blocks */}
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-1 bg-indigo-600 rounded-full" />
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Schedule Blocks
                        </h4>
                      </div>

                      <button
                        onClick={addDateGroup}
                        className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Plus size={14} /> Add Date
                      </button>
                    </div>

                    <div className="space-y-6">
                      {groups.map((group, gIdx) => (
                        <div
                          key={gIdx}
                          className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4 relative group/block"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                                Date
                              </label>
                              <input
                                type="date"
                                value={group.date}
                                onChange={(e) => updateDate(gIdx, e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm font-bold text-indigo-700 outline-none"
                              />
                            </div>

                            {groups.length > 1 && (
                              <button
                                onClick={() => removeDateGroup(gIdx)}
                                className="mt-5 p-2 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {group.times.map((time, tIdx) => (
                              <div key={tIdx} className="relative group/time flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Clock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover/time:text-indigo-400"
                                    size={14}
                                  />
                                  <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => updateTime(gIdx, tIdx, e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                                  />
                                </div>

                                {group.times.length > 1 && (
                                  <button
                                    onClick={() => removeTime(gIdx, tIdx)}
                                    className="text-slate-300 hover:text-red-500"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}

                            <button
                              onClick={() => addTime(gIdx)}
                              className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl py-2 text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all bg-white/50"
                            >
                              <Plus size={14} /> Add Time
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-8 bg-white border-t border-slate-100 shrink-0 space-y-4">
                  {message.text ? (
                    <div
                      className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${
                        message.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                      {message.text}
                    </div>
                  ) : null}

                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{editingRow ? "Updating..." : "Creating Slots..."}</span>
                      </>
                    ) : (
                      <span>{editingRow ? "Update Availability" : "Generate Availability"}</span>
                    )}
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
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

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-[1.5rem] shadow-sm border border-slate-200/60 flex items-center gap-3 sm:gap-4">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-indigo-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}