"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  User,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
  Lock,
} from "lucide-react";

/* ================= TYPES ================= */

type BookingAppProps = {
  onSuccess?: () => void;
};

type StudentAPIResp = {
  id: number;
  name: string;
  email: string;
  phone?: string;
};

const TIME_SLOTS = ["10:00 AM", "02:00 PM", "06:00 PM"] as const;
const INITIAL_SEATS = 10;

type SlotsData = Record<string, number>;

/* ================= HELPERS ================= */

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const formatDateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDaysInMonth = (date: Date): Array<Date | null> => {
  const y = date.getFullYear();
  const m = date.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const out: Array<Date | null> = [];
  for (let i = 0; i < first; i++) out.push(null);
  for (let d = 1; d <= days; d++) out.push(new Date(y, m, d));
  return out;
};

const loadSlots = (): SlotsData => {
  try {
    return JSON.parse(localStorage.getItem("slots") || "{}");
  } catch {
    return {};
  }
};

const saveSlots = (d: SlotsData) =>
  localStorage.setItem("slots", JSON.stringify(d));

const saveBooking = (b: any) => {
  try {
    const list = JSON.parse(localStorage.getItem("bookings") || "[]");
    list.push(b);
    localStorage.setItem("bookings", JSON.stringify(list));
  } catch {
    localStorage.setItem("bookings", JSON.stringify([b]));
  }
};

/* ================= COMPONENT ================= */

export default function MentorsBooking({ onSuccess }: BookingAppProps) {
  const router = useRouter();

  const [student, setStudent] = useState<StudentAPIResp | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [slotsData, setSlotsData] = useState<SlotsData>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState("");

  const calendarRef = useRef<HTMLDivElement | null>(null);
  const today = startOfToday();
  const filledOnce = useRef(false);

  /* ================= LOAD STUDENT ================= */

  useEffect(() => {
    const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
    if (!raw) {
      router.push("/");
      return;
    }

    const parsed = JSON.parse(raw);

    fetch("/api/student/me", {
      headers: { "x-user-email": parsed.email },
    })
      .then((r) => r.json())
      .then((data: StudentAPIResp) => {
        setStudent(data);

        if (!filledOnce.current) {
          setFormData({
            name: data.name,
            email: data.email,
            phone: data.phone ?? "",
          });
          filledOnce.current = true;
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoadingStudent(false));
  }, [router]);

  /* ================= LOAD SLOTS ================= */

  useEffect(() => {
    setSlotsData(loadSlots());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ================= SEAT HELPERS ================= */

  const seatsForSlot = (date: Date, time: string) => {
    const key = `${formatDateKey(date)}_${time}`;
    return typeof slotsData[key] === "number" ? slotsData[key] : INITIAL_SEATS;
  };

  const totalSeatsForDate = (date: Date) =>
    TIME_SLOTS.reduce((sum, t) => sum + seatsForSlot(date, t), 0);

  const firstAvailableSlot = (date: Date) => {
    for (const t of TIME_SLOTS) {
      if (seatsForSlot(date, t) > 0) return t;
    }
    return null;
  };

  const decrementSlot = (date: Date, time: string) => {
    const key = `${formatDateKey(date)}_${time}`;
    const current = seatsForSlot(date, time);
    const updated = { ...slotsData, [key]: Math.max(0, current - 1) };
    saveSlots(updated);
    setSlotsData(updated);
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedDate) {
      setError("Please select a date.");
      return;
    }

    const bookingDateObj = selectedDate;

    const total = totalSeatsForDate(bookingDateObj);
    if (total <= 0) {
      setError("No seats available on this date.");
      return;
    }

    const slot = firstAvailableSlot(bookingDateObj);
    if (!slot) {
      setError("No time slot available.");
      return;
    }

    decrementSlot(bookingDateObj, slot);

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      date: formatDateKey(bookingDateObj),
      time: slot,
      studentId: student?.id ?? null,
    };

    saveBooking({ ...payload, createdAt: new Date().toISOString() });

    await fetch("/api/booking-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    onSuccess?.();
  };

  /* ================= UI ================= */

  if (loadingStudent) {
    return <div className="p-6 text-center text-sm text-slate-500">Loading booking…</div>;
  }

  return (
    <div className="w-full">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
            <Users size={18} />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">Student Portal</span>
        </div>
        <h3 className="text-2xl font-bold tracking-tight">Mentor Office Hours</h3>
        <p className="text-indigo-100/80 text-sm mt-1">Book a 1:1 session with your assigned mentor.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4 p-6 bg-white rounded-b-xl shadow">
        {/* NAME (auto-filled, read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1">
              <Lock size={10} /> Full Name
            </label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" size={16} />
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                value={formData.name}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1">
              <Lock size={10} /> Phone Number
            </label>
            <div className="relative group">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" size={16} />
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                value={formData.phone}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1">
              <Lock size={10} /> Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" size={16} />
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                value={formData.email}
                disabled
                readOnly
              />
            </div>
          </div>
        </div>
 
        <div className="h-px bg-slate-100" />
        {/* Calendar */}
          <div ref={calendarRef} className=" space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Select Available Friday</label>
          <div
            onClick={() => setShowCalendar((s) => !s)}
            className={`flex items-center justify-between px-4 py-2 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
              showCalendar 
              ? "border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-50" 
              : selectedDate 
                ? "border-indigo-200 bg-white" 
                : "border-slate-200 bg-white hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selectedDate ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                <CalendarIcon size={18} />
              </div>
              <span className={`font-semibold ${selectedDate ? "text-indigo-900" : "text-slate-400"}`}>
                {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Pick a date"}
              </span>
            </div>
            <div className="text-slate-400">
              <ChevronRight size={18} className={`transition-transform duration-300 ${showCalendar ? "rotate-90" : ""}`} />
            </div>
          </div>

          {/* Compact Full Calendar Overlay */}
          {showCalendar && (
            <div className="absolute top-20 md:left-auto md:top-0 md:right-5 md:w-[300px] z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-4 px-1">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-800">
                  {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div key={d} className="text-[10px] font-black text-slate-300 py-1">
                    {d}
                  </div>
                ))}

                {getDaysInMonth(currentMonth).map((d, i) => {
                  if (!d) return <div key={`blank-${i}`} className="w-8 h-8" />;
                  const isFriday = d.getDay() === 5;
                  const isPast = d.getTime() < today.getTime();
                  const selectable = isFriday && !isPast;
                  const isSelected = selectedDate && d.getTime() === selectedDate.getTime();

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!selectable}
                      onClick={() => {
                        setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
                        setShowCalendar(false);
                      }}
                      onMouseEnter={() => setHoveredDate(d)}
                      onMouseLeave={() => setHoveredDate(null)}
                      className={`w-8 h-8 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center
                        ${isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 z-10" : 
                          selectable ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white" : 
                          "text-slate-300 cursor-not-allowed"}
                      `}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50">
                <div className="flex items-center justify-center gap-2 text-[10px] font-medium min-h-[16px]">
                  {hoveredDate ? (
                    totalSeatsForDate(hoveredDate) > 0 ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {totalSeatsForDate(hoveredDate)} seats available
                      </span>
                    ) : (
                      <span className="text-rose-500">Waitlist Only</span>
                    )
                  ) : (
                    <span className="text-slate-400">Select a highlighted Friday</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div>
          <button type="submit" disabled={!selectedDate} className="w-full p-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50">
            Confirm Booking
          </button>
        </div>
      </form>
    </div>
  );
}
