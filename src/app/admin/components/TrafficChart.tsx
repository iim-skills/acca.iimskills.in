"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TrafficData = {
  period: string;
  views: number;
};

export default function TrafficReport({ pageFilter }: { pageFilter?: string }) {
  const [data, setData] = useState<TrafficData[]>([]);
  const [filter, setFilter] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const url = new URL("/api/track-page/report", window.location.origin);
        url.searchParams.set("filter", filter);
        if (pageFilter) url.searchParams.set("page", pageFilter);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch report");

        const json = await res.json();
        // Show at least one empty point if no data
        setData(json.length ? json : [{ period: "No Data", views: 0 }]);
      } catch (err) {
        console.error(err);
        setData([{ period: "Error", views: 0 }]);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [filter, pageFilter]);

  return (
    <div className="bg-white shadow rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-lg">Traffic Report {pageFilter ? `(${pageFilter})` : ""}</h3>

      {/* Filter buttons */}
      <div className="flex space-x-2">
        {["daily", "weekly", "monthly", "yearly"].map((f) => (
          <button
            key={f}
            className={`px-3 py-1 rounded text-white ${
              filter === f ? "bg-blue-600" : "bg-blue-400 hover:bg-blue-500"
            }`}
            onClick={() => setFilter(f as any)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-72">
        {loading ? (
          <p className="text-gray-500 text-center mt-20">Loading...</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Optional: Show raw details */}
      <div className="overflow-x-auto">
        {data.length > 0 && (
          <table className="w-full border-collapse border text-left text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-3 py-1">#</th>
                <th className="border px-3 py-1">Period</th>
                <th className="border px-3 py-1">Views</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="border px-3 py-1">{idx + 1}</td>
                  <td className="border px-3 py-1">{d.period}</td>
                  <td className="border px-3 py-1">{d.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
