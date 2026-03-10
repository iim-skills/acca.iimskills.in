// components/MentorsBooking.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, User, Mail, Phone, ChevronLeft, ChevronRight, AlertCircle, Users, Lock } from "lucide-react";

type BookingAppProps = { onSuccess?: () => void };
type StudentAPIResp = { id: number; name: string; email: string; phone?: string };

type SlotInfo = {
  rowId: number;         // mentor_slots row id
  mentor_name: string;
  time: string;          // "HH:MM:SS"
  capacity: number;
  booked: number;
  available: number;
  notes?: string | null;
  meeting_url?: string | null;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const getDaysInMonth = (date: Date): Array<Date | null> => {
  const y = date.getFullYear(), m = date.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const out: Array<Date | null> = [];
  for (let i = 0; i < first; i++) out.push(null);
  for (let d = 1; d <= days; d++) out.push(new Date(y, m, d));
  return out;
};
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const formatSelectedDate = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

export default function MentorsBooking({ onSuccess }: BookingAppProps) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentAPIResp | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [currentMonth, setCurrentMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null); // "HH:MM:SS"
  const [selectedSlotRowId, setSelectedSlotRowId] = useState<number | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, SlotInfo[]>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState("");
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const today = startOfToday();
  const filledOnce = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
    if (!raw) { router.push("/"); return; }
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { router.push("/"); return; }
    fetch("/api/student/me", { headers: { "x-user-email": parsed.email } })
      .then((r) => r.json())
      .then((data: StudentAPIResp) => {
        setStudent(data);
        if (!filledOnce.current) {
          setFormData({ name: data.name, email: data.email, phone: data.phone ?? "" });
          filledOnce.current = true;
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoadingStudent(false));
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setShowCalendar(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSlotsForMonth = async (monthDate: Date) => {
    try {
      const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const startKey = formatDateKey(start);
      const endKey = formatDateKey(end);

      const res = await fetch(`/api/student/mentor-slots?start=${startKey}&end=${endKey}`);
      if (!res.ok) { console.warn("mentor-slots fetch failed", await res.text()); return; }
      const rows: any[] = await res.json();

      const newSlotsByDate: Record<string, SlotInfo[]> = {};
      for (const r of rows) {
        const dateKey = r.slot_date; // YYYY-MM-DD
        const times = Array.isArray(r.slot_times) ? r.slot_times : [];
        const slotObjs: SlotInfo[] = times.map((t: any) => ({
          rowId: r.id,
          mentor_name: r.mentor_name,
          time: t.time,
          capacity: Number(t.capacity || 0),
          booked: Number(t.booked || 0),
          available: Math.max(0, Number(t.capacity || 0) - Number(t.booked || 0)),
          notes: t.notes ?? null,
          meeting_url: t.meeting_url ?? null,
        }));
        // sort by time
        slotObjs.sort((a,b) => a.time.localeCompare(b.time));
        newSlotsByDate[dateKey] = (newSlotsByDate[dateKey] || []).concat(slotObjs);
      }
      setSlotsByDate(prev => ({ ...prev, ...newSlotsByDate }));
    } catch (err) {
      console.error("fetchSlotsForMonth error", err);
    }
  };

  useEffect(() => {
    if (showCalendar) fetchSlotsForMonth(currentMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCalendar, currentMonth]);

  const getSlotsForDate = (date: Date) => slotsByDate[formatDateKey(date)] ?? [];
  const totalSeatsForDate = (date: Date) => getSlotsForDate(date).reduce((s, x) => s + x.available, 0);
  const dateHasSlots = (date: Date) => getSlotsForDate(date).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedDate) { setError("Please select a date."); return; }
    if (!selectedSlotRowId || !selectedTime) { setError("Please select a time slot."); return; }

    const bookingDateObj = selectedDate;
    const total = totalSeatsForDate(bookingDateObj);
    if (total <= 0) { setError("No seats available on this date."); return; }

    try {
      const payload = {
        slotRowId: selectedSlotRowId,
        slotTime: selectedTime,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        studentId: student?.id ?? null,
      };

      const res = await fetch("/api/student/slotbookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) { setError(json?.error || "Failed to create booking"); return; }

      // update local UI
      const dateKey = formatDateKey(bookingDateObj);
      setSlotsByDate(prev => {
        const copy = { ...prev };
        copy[dateKey] = (copy[dateKey] || []).map(s => {
          if (s.rowId === selectedSlotRowId && s.time === selectedTime) {
            return { ...s, booked: s.booked + 1, available: Math.max(0, s.available - 1) };
          }
          return s;
        });
        return copy;
      });

      onSuccess?.();
    } catch (err) {
      console.error("booking error", err);
      setError("Failed to create booking");
    }
  };

  if (loadingStudent) return <div className="p-6 text-center text-sm text-slate-500">Loading booking…</div>;

  const selectedDateSlots = selectedDate ? getSlotsForDate(selectedDate) : [];

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white rounded-t-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md"><Users size={18} /></div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">Student Portal</span>
        </div>
        <h3 className="text-2xl font-bold tracking-tight">Mentor Office Hours</h3>
        <p className="text-indigo-100/80 text-sm mt-1">Book a 1:1 session with your assigned mentor.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4 p-6 bg-white rounded-b-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Lock size={10} /> Full Name</label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-500 text-sm" value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Lock size={10} /> Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-500 text-sm" value={formData.phone} onChange={(e)=>setFormData({...formData,phone:e.target.value})} />
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Lock size={10} /> Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-500 text-sm" value={formData.email} onChange={(e)=>setFormData({...formData,email:e.target.value})} />
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div ref={calendarRef} className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Select Available Date</label>

          <div onClick={() => setShowCalendar(s => !s)} className={`flex items-center justify-between px-4 py-2 border-2 rounded-xl cursor-pointer ${showCalendar ? "border-indigo-600 bg-indigo-50/30" : selectedDate ? "border-indigo-200 bg-white" : "border-slate-200 bg-white hover:border-indigo-300"}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selectedDate ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}><CalendarIcon size={18} /></div>
              <div>
                <div className={`font-semibold ${selectedDate ? "text-indigo-900" : "text-slate-400"}`}>{selectedDate ? formatSelectedDate(selectedDate) : "Pick a date"}</div>
                <div className="mt-1">
                  <input className="w-full max-w-xs pl-3 pr-3 py-1.5 text-sm rounded-md border bg-white cursor-not-allowed text-slate-600" readOnly value={selectedTime ?? (selectedDate ? "Please select a time" : "")} />
                </div>
              </div>
            </div>
            <div className="text-slate-400"><ChevronRight size={18} className={`${showCalendar ? "rotate-90" : ""}`} /></div>
          </div>

          {/* Selected date time list */}
          {selectedDate && (
            <div className="mt-2">
              <div className="text-[12px] text-slate-500 mb-2">Available times for {formatSelectedDate(selectedDate)}:</div>
              <div className="flex flex-wrap gap-2">
                {selectedDateSlots.length === 0 ? <div className="text-slate-400 text-sm">No slots found.</div> : selectedDateSlots.map(s => (
                  <button key={`${s.rowId}-${s.time}`} type="button" onClick={() => { setSelectedTime(s.time); setSelectedSlotRowId(s.rowId); }} className={`px-3 py-1.5 rounded-md text-sm border ${selectedSlotRowId === s.rowId && selectedTime === s.time ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50"}`}>
                    <div className="font-medium">{s.time.replace(/:00$/, "")}</div>
                    <div className="text-xs text-slate-500">{s.mentor_name} • {s.available > 0 ? `${s.available} seats` : "Waitlist"}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showCalendar && (
            <div className="absolute left-[20%] top-10 mt-2 w-full max-w-[220px] z-50 bg-white border rounded-2xl shadow p-4">
              <div className="flex items-center justify-between mb-4 px-1">
                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600"><ChevronLeft size={16} /></button>
                <span className="text-sm font-bold text-slate-800">{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600"><ChevronRight size={16} /></button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["S","M","T","W","T","F","S"].map((d) => <div key={d} className="text-[10px] font-black text-slate-300 py-1">{d}</div>)}

                {getDaysInMonth(currentMonth).map((d, i) => {
                  if (!d) return <div key={`blank-${i}`} className="w-4 h-4" />;
                  const isPast = d.getTime() < today.getTime();
                  const hasSlots = dateHasSlots(d);
                  const selectable = hasSlots && !isPast;
                  const isSelected = selectedDate && d.getTime() === selectedDate.getTime();

                  return (
                    <button key={i} type="button" disabled={!selectable}
                      onClick={() => { const picked = new Date(d.getFullYear(), d.getMonth(), d.getDate()); setSelectedDate(picked); setSelectedTime(null); setSelectedSlotRowId(null); setShowCalendar(false); }}
                      onMouseEnter={() => setHoveredDate(d)} onMouseLeave={() => setHoveredDate(null)}
                      className={`relative w-4 h-4 text-[11px] font-bold rounded-lg flex items-center justify-center ${isSelected ? "bg-indigo-600 text-white" : selectable ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white" : "text-slate-300 cursor-not-allowed"}`}>
                      <div className="flex items-center justify-center w-full h-full">
                        <span>{d.getDate()}</span>
                        {hasSlots && <span className="absolute right-0 bottom-0 mr-0 mb-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50">
                <div className="min-h-[40px]">
                  {hoveredDate ? (() => {
                    const key = formatDateKey(hoveredDate);
                    const slots = slotsByDate[key];
                    if (!slots || slots.length === 0) return <div className="text-slate-400 text-[12px]">No scheduled slots for this date.</div>;
                    return (
                      <div className="space-y-2 text-sm">
                        {slots.map(s => (
                          <div key={`${s.rowId}-${s.time}`} className="flex  items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-semibold text-[13px]">{s.time.replace(/:00$/, "")}  </div>
                              <div className="text-[12px] text-slate-500">{s.available > 0 ? `${s.available} seats` : "Waitlist only"}{s.notes ? ` • ${s.notes}` : ""}</div>
                            </div>
                           
                          </div>
                        ))}
                      </div>
                    );
                  })() : <div className="text-slate-400 text-[12px]">Hover a date to see slot details.</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="text-sm text-red-600 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}

        <div>
          <button type="submit" disabled={!selectedDate || !selectedSlotRowId || !selectedTime} className="w-full p-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50">Confirm Booking</button>
        </div>
      </form>
    </div>
  );
}