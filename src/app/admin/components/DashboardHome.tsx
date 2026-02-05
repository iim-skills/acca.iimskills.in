"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import TrafficChart from "./TrafficChart"; // import your traffic chart

const paymentData = [
  { month: "Jan", amount: 4000 },
  { month: "Feb", amount: 3000 },
  { month: "Mar", amount: 5000 },
  { month: "Apr", amount: 2500 },
];

const leadData = [
  { day: "Mon", leads: 30 },
  { day: "Tue", leads: 20 },
  { day: "Wed", leads: 40 },
  { day: "Thu", leads: 35 },
  { day: "Fri", leads: 50 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl font-bold">📊 Admin Dashboard</h2>

      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="font-semibold mb-2">Payment Overview</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={paymentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="font-semibold mb-2">Leads per Day</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={leadData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="leads" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Traffic Chart */}
      <TrafficChart />
    </div>
  );
}
