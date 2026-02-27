"use client";

import React, { useEffect, useState } from "react";
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
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";

/* ================= TYPES ================= */
type DateGroup = {
  date: string;
  times: string[];
};

type SlotRow = {
  id: number;
  mentor_name: string;
  mentor_email: string;
  meeting_url?: string
  slot_start: string;
  slot_times: { time: string; capacity: number; booked: number; }[];
};

export default function AdminMentorSlotsPage() {
  const [mentorName, setMentorName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [capacity, setCapacity] = useState(30);
  const [notes, setNotes] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [editingRow, setEditingRow] = useState<SlotRow | null>(null);

  const [groups, setGroups] = useState<DateGroup[]>([
    { date: "", times: ["17:00"] },
  ]);

  const [rows, setRows] = useState<SlotRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  /* ================= LOAD SLOT LIST ================= */
  const loadSlots = async () => {
    try {
      const res = await fetch("/api/admin/mentor_slots");
      const json = await res.json();
      setRows(json.rows || []);
    } catch (e) {
      console.error("Load slots error", e);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  /* ================= GROUP HANDLERS ================= */
  const addDateGroup = () => {
    setGroups((g) => [...g, { date: "", times: [""] }]);
  };

  const removeDateGroup = (idx: number) => {
    setGroups((g) => g.filter((_, i) => i !== idx));
  };

  const updateDate = (idx: number, val: string) => {
    setGroups((g) => g.map((v, i) => (i === idx ? { ...v, date: val } : v)));
  };

  const openEditSession = (row: SlotRow) => {
  setEditingRow(row);

  // Pre-fill form fields
  setMentorName(row.mentor_name || "");
  setMentorEmail(row.mentor_email || "");
  setMeetingUrl((row as any).meeting_url || "");

  // Set date & times into groups
  setGroups([
    {
      date: row.slot_start?.split("T")[0] || "",
      times: row.slot_times?.map((t) =>
        String(t.time || "").replace(/:00$/, "")
      ) || [""],
    },
  ]);

  setPanelOpen(true);
};

  const deleteSession = async (id:number)=>{
  if(!confirm("Delete this session?")) return;

  await fetch(`/api/admin/mentor_slots/${id}`,{
    method:"DELETE"
  });

  loadSlots();
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
    if (!mentorName) {
      setMessage("error:Mentor name is required");
      return;
    }

    setCreating(true);
    setMessage("");

    try {
      for (const group of groups) {
        if (!group.date) continue;

        const slots = group.times
          .filter((t) => t)
          .map((time) => ({
            time: `${time}:00`,
            capacity: Number(capacity || 1),
             // optimized: attached to each slot
          }));

        if (!slots.length) continue;

        const payload = {
  mentorName,
  mentorEmail,
  courseId,
  slotDate: group.date,
  meetingUrl,   // ⭐ NEW SEPARATE COLUMN
  slots,
  notes,
  isActive: 1,
};

        const res = await fetch("/api/admin/mentor_slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed");
      }

      setMessage("success:Slots created successfully");
      setTimeout(() => {
        setPanelOpen(false);
        setMessage("");
        // Reset form
        setMentorName("");
        setMentorEmail("");
        setCourseId("");
        setNotes("");
        setMeetingUrl("");
      }, 1500);
      loadSlots(); 
    } catch (err) {
      setMessage("error:Error creating slots");
    } finally {
      setCreating(false);
    }
  };

  /* ================= UI COMPONENTS ================= */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1">Office Hours Manager</h1>
            <p className="text-slate-500 font-medium">Create and manage mentor availability slots for students.</p>
          </div>

          <button
            onClick={() => setPanelOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>Create Mentor Slots</span>
          </button>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[
                { label: "Active Sessions", value: rows.length, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Total Capacity", value: rows.reduce((acc, curr) => acc + (curr.slot_times?.reduce((s, t) => s + t.capacity, 0) || 0), 0), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Mentors Listed", value: new Set(rows.map(r => r.mentor_name)).size, icon: User, color: "text-amber-600", bg: "bg-amber-50" }
            ].map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                        <stat.icon size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* SLOT TABLE */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-white flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Current Availability</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" placeholder="Search mentors..." />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Mentor / Course</th>
                  <th className="px-6 py-4">Session Date</th>
                  <th className="px-6 py-4">Slots & Links</th>
                  <th className="px-6 py-4">Availability</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {rows.length === 0 ? (
                  <tr>
                    <td className="p-12 text-center text-slate-400" colSpan={5}>
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <Calendar size={48} strokeWidth={1} />
                        <p className="font-medium">No slots have been created yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-base">{r.mentor_name}</span>
                          <span className="text-slate-400 text-xs font-medium">{r.mentor_email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-xs uppercase tracking-tight">
                            <Calendar size={12} />
                            {r.slot_start?.split("T")[0]}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {r.slot_times?.map((t, i) => (
                            <div key={i} className="flex items-center gap-1 group/item">
                                <span className="text-[11px] font-bold border border-slate-200 bg-white px-2 py-0.5 rounded-md text-slate-600 shadow-sm">
                                    {t.time.replace(/:00$/, "")}
                                </span>
                                {r.meeting_url && (
                                    <a 
                                        href={r.meeting_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                        title="Join Meeting"
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {r.slot_times?.map((t, i) => {
                            const left = t.capacity - (t.booked || 0);
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${left === 0 ? 'bg-red-400' : 'bg-emerald-400'}`} 
                                            style={{ width: `${Math.min(100, ((t.booked || 0) / t.capacity) * 100)}%` }} 
                                        />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase ${left === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                        {left} Left
                                    </span>
                                </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">

  {/* EDIT */}
  <button
    onClick={() => openEditSession(r)}
    className="p-2 hover:bg-indigo-50 rounded-lg"
  >
    Edit
  </button>

  {/* DELETE */}
  <button
    onClick={() => deleteSession(r.id)}
    className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
  >
    Delete
  </button>

  {/* DOWNLOAD */}
  <a
    href={`/api/admin/mentor_slots/${r.id}/download`}
    target="_blank"
    className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg"
  >
    Download
  </a>

</div>  
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATION DRAWER */}
        <AnimatePresence>
          {panelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPanelOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              />

              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col"
              >
                {/* Drawer Header */}
                <div className="p-8 bg-indigo-600 text-white shrink-0 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <Calendar size={120} />
                  </div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight">Create Session</h3>
                      <p className="text-indigo-100 text-sm opacity-90 font-medium">Add new mentor availability blocks.</p>
                    </div>
                    <button 
                        onClick={() => setPanelOpen(false)}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X />
                    </button>
                  </div>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-white rounded-t-3xl -mt-5 relative z-20 shadow-2xl">
                  
                  {/* Mentor Details Group */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-1 bg-indigo-600 rounded-full" />
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Information</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5 group">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                            <User size={12} /> Mentor Name
                        </label>
                        <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none" 
                            placeholder="e.g. Dr. Sarah Chen" 
                            value={mentorName} 
                            onChange={(e)=>setMentorName(e.target.value)} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                            <Mail size={12} /> Mentor Email
                        </label>
                        <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none" 
                            placeholder="sarah@university.edu" 
                            value={mentorEmail} 
                            onChange={(e)=>setMentorEmail(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                                <BookOpen size={12} /> Course ID
                            </label>
                            <input 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none" 
                                placeholder="CS-101" 
                                value={courseId} 
                                onChange={(e)=>setCourseId(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                                <Users size={12} /> Capacity
                            </label>
                            <input 
                                type="number" 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold" 
                                value={capacity} 
                                onChange={(e)=>setCapacity(Number(e.target.value))} 
                            />
                        </div>
                      </div>

                      {/* Meeting URL Input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                            <LinkIcon size={12} /> Meeting URL
                        </label>
                        <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-medium text-indigo-600" 
                            placeholder="https://zoom.us/j/..." 
                            value={meetingUrl} 
                            onChange={(e)=>setMeetingUrl(e.target.value)} 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                            <FileText size={12} /> Private Notes
                        </label>
                        <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none" 
                            placeholder="Optional instructions..." 
                            value={notes} 
                            onChange={(e)=>setNotes(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Scheduling Blocks */}
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-1 bg-indigo-600 rounded-full" />
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule Blocks</h4>
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
                        <div key={gIdx} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4 relative group/block">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date</label>
                                    <input 
                                        type="date" 
                                        value={group.date} 
                                        onChange={(e)=>updateDate(gIdx,e.target.value)} 
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

                            <div className="grid grid-cols-2 gap-3">
                                {group.times.map((time, tIdx) => (
                                    <div key={tIdx} className="relative group/time flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover/time:text-indigo-400" size={14} />
                                            <input 
                                                type="time" 
                                                value={time} 
                                                onChange={(e)=>updateTime(gIdx, tIdx, e.target.value)} 
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none" 
                                            />
                                        </div>
                                        {group.times.length > 1 && (
                                            <button onClick={()=>removeTime(gIdx,tIdx)} className="text-slate-300 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    onClick={()=>addTime(gIdx)} 
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

                {/* Drawer Footer */}
                <div className="p-8 bg-white border-t border-slate-100 shrink-0 space-y-4">
                  {message && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom-2 ${
                        message.startsWith("success") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                        {message.startsWith("success") ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {message.split(":")[1] || message}
                    </div>
                  )}

                  <button 
                    onClick={handleCreate} 
                    disabled={creating} 
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Creating Slots...</span>
                        </>
                    ) : (
                        <span>Generate Availability</span>
                    )}
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}