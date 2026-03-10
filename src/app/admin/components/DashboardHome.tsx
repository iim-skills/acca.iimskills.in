import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { 
  BookOpen, 
  Users, 
  FileQuestion, 
  Video, 
  Layers, 
  Ticket, 
  Calendar, 
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

// Types derived from your implementation
type Stats = {
  courses?: { totalCourses?: number } | null;
  batches?: {
    totalBatches?: number;
    activeBatches?: number;
    upcomingBatches?: number;
  } | null;
  students?: { totalStudents?: number } | null;
  quiz?: { totalQuiz?: number } | null;
  videos?: { totalVideos?: number } | null;
  coupons?: {
    totalCoupons?: number;
    activeCoupons?: number;
    expiredCoupons?: number;
  } | null;
  mentorSlots?: {
    totalCapacity?: number;
    filledSlots?: number;
  } | null;
};

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setStats({});
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  /* ================= DATA PROCESSING ================= */
  const totalCourses = stats.courses?.totalCourses ?? 0;
  const totalStudents = stats.students?.totalStudents ?? 0;
  const totalQuiz = stats.quiz?.totalQuiz ?? 0;
  const totalVideos = stats.videos?.totalVideos ?? 0;
  const totalBatches = stats.batches?.totalBatches ?? 0;
  const activeBatches = stats.batches?.activeBatches ?? 0;
  const upcomingBatches = stats.batches?.upcomingBatches ?? 0;
  const totalCoupons = stats.coupons?.totalCoupons ?? 0;
  const activeCoupons = stats.coupons?.activeCoupons ?? 0;
  const expiredCoupons = stats.coupons?.expiredCoupons ?? 0;
  const totalSlots = stats.mentorSlots?.totalCapacity ?? 0;
  const filledSlots = stats.mentorSlots?.filledSlots ?? 0;
  const availableSlots = Math.max(0, totalSlots - filledSlots);

  /* ================= CHART CONFIGS ================= */
  const batchChart = [
    { name: "Active", value: activeBatches, color: "#3b82f6" },
    { name: "Upcoming", value: upcomingBatches, color: "#60a5fa" },
  ];

  const couponChart = [
    { name: "Active", value: activeCoupons, color: "#10b981" },
    { name: "Expired", value: expiredCoupons, color: "#f43f5e" },
  ];

  const mentorChart = [
    { name: "Filled", value: filledSlots, color: "#f59e0b" },
    { name: "Available", value: availableSlots, color: "#fbbf24" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <LayoutDashboard size={28} />
              </div>
              Admin Analytics
            </h1>
            <p className="text-slate-500 mt-1">Real-time overview of your platform's performance.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Live System Status
          </div>
        </div>

        {/* ================= PRIMARY STATS ================= */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Core Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Courses" value={totalCourses} icon={<BookOpen />} color="blue" />
            <StatCard title="Active Students" value={totalStudents} icon={<Users />} color="purple" />
            <StatCard title="Assessments" value={totalQuiz} icon={<FileQuestion />} color="emerald" />
            <StatCard title="Video Library" value={totalVideos} icon={<Video />} color="rose" />
          </div>
        </section>

        {/* ================= SECONDARY STATS ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Detailed Batch Metrics */}
          <div className="lg:col-span-3 space-y-4">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Batch & Revenue Management</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Batches" value={totalBatches} icon={<Layers />} color="slate" variant="compact" />
                <StatCard title="Active Batches" value={activeBatches} icon={<CheckCircle2 />} color="blue" variant="compact" />
                <StatCard title="Upcoming" value={upcomingBatches} icon={<Clock />} color="sky" variant="compact" />
                <StatCard title="Total Coupons" value={totalCoupons} icon={<Ticket />} color="indigo" variant="compact" />
                <StatCard title="Active Coupons" value={activeCoupons} icon={<CheckCircle2 />} color="emerald" variant="compact" />
                <StatCard title="Mentor Allocation" value={`${filledSlots}/${totalSlots}`} icon={<Calendar />} color="amber" variant="compact" />
             </div>

             {/* Main Chart Area */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
  
  {/* Batch Distribution - Area Chart */}
  <ChartCard title="Batch Distribution" subtitle="Active vs Upcoming Batches">
    <AreaChart data={batchChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="colorBatch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
      <Tooltip 
        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
      />
      <Area 
        type="monotone" 
        dataKey="value" 
        stroke="#3b82f6" 
        strokeWidth={3}
        fillOpacity={1} 
        fill="url(#colorBatch)" 
        dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
        activeDot={{ r: 6, strokeWidth: 0 }}
      />
    </AreaChart>
  </ChartCard>

  {/* Coupon Efficiency - Area Chart (Emerald Variation) */}
  <ChartCard title="Coupon Efficiency" subtitle="Usage and availability status">
    <AreaChart data={couponChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="colorCoupon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
      <Tooltip 
        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
      />
      <Area 
        type="monotone" 
        dataKey="value" 
        stroke="#10b981" 
        strokeWidth={3}
        fillOpacity={1} 
        fill="url(#colorCoupon)" 
        dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
      />
    </AreaChart>
  </ChartCard>

  {/* Mentor Slots - Capsule Design */}
  <ChartCard title="Mentor Slots" subtitle="Session capacity tracking">
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center px-4">
        {mentorChart.map((item, idx) => (
          <div key={idx} className="mb-8 last:mb-0">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-700">{item.name}</span>
              <span className="text-sm font-medium text-slate-500">{item.value} Slots</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${(item.value / totalSlots) * 100}%`, 
                  backgroundColor: item.color,
                  boxShadow: `0 0 12px ${item.color}40`
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
     
    </div>
  </ChartCard>
</div>
          </div>

          {/* Side Panel Chart */}
          

        </section>
      </div>
    </div>
  );
}

/* ================= COMPONENT: CHART CARD ================= */

function ChartCard({
  title,
  subtitle,
  children,
  height = 300
}: {
  title: string;
  subtitle?: string;
  children: React.ReactElement;
  height?: number;
}) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div style={{ height: height - 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ================= COMPONENT: STAT CARD ================= */

const colorMap = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "bg-blue-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "bg-purple-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "bg-emerald-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", icon: "bg-rose-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "bg-amber-600" },
  sky: { bg: "bg-sky-50", text: "text-sky-600", icon: "bg-sky-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "bg-indigo-600" },
  slate: { bg: "bg-slate-50", text: "text-slate-600", icon: "bg-slate-600" },
};

function StatCard({
  title,
  value,
  icon,
  color = "blue",
  variant = "default"
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: keyof typeof colorMap;
  variant?: "default" | "compact";
}) {
  const styles = colorMap[color];

  if (variant === "compact") {
    return (
      <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 flex items-center gap-4 transition-transform hover:-translate-y-1">
        <div className={`p-2 rounded-lg ${styles.bg} ${styles.text}`}>
          {React.cloneElement(icon as React.ReactElement, { size: 20 } as any)}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 truncate uppercase tracking-tight">{title}</p>
          <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:shadow-lg group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl transition-colors ${styles.bg} ${styles.text} group-hover:${styles.icon} group-hover:text-white`}>
          {React.cloneElement(icon as React.ReactElement, { size: 24 } as any)}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[10px] font-bold py-0.5 px-2 bg-slate-100 text-slate-500 rounded uppercase">Updated Now</span>
      </div>
    </div>
  );
}