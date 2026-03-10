"use client";
import { useEffect, useState, useRef } from "react";

type Order = {
  id: string;
  amount: number;
  email?: string;
  name?: string;
  phone?: string;
  course?: string;
  status: "success" | "failed" | "pending";
  created_at: string;
};

type HighlightMap = { [orderId: string]: boolean };

export default function PaymentDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const prevOrdersRef = useRef<Order[]>([]);
  const [highlightMap, setHighlightMap] = useState<HighlightMap>({});

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/razorpay-webhook");
      const data = await res.json();
      const latestOrders: Order[] = data.orders || [];

      // Highlight changes
      const newHighlightMap: HighlightMap = {};
      latestOrders.forEach((order) => {
        const prev = prevOrdersRef.current.find((o) => o.id === order.id);
        if (prev && prev.status !== order.status) {
          newHighlightMap[order.id] = true;
        }
      });

      setHighlightMap(newHighlightMap);
      setOrders(latestOrders);
      prevOrdersRef.current = latestOrders;

      setTimeout(() => setHighlightMap({}), 3000);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Razorpay Orders (Live)</h1>
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Order ID</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Phone</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Course</th>
            <th className="border px-4 py-2">Amount (₹)</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className={`text-center transition-colors duration-500 ${
                highlightMap[o.id] ? "bg-yellow-200" : ""
              }`}
            >
              <td className="border px-4 py-2">{o.id}</td>
              <td className="border px-4 py-2">{o.name || "-"}</td>
              <td className="border px-4 py-2">{o.phone || "-"}</td>
              <td className="border px-4 py-2">{o.email || "-"}</td>
              <td className="border px-4 py-2">{o.course || "-"}</td>
              <td className="border px-4 py-2">{(o.amount / 100).toFixed(2)}</td>
              <td
                className={`border px-4 py-2 font-semibold ${
                  o.status === "success"
                    ? "text-green-600"
                    : o.status === "failed"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {o.status}
              </td>
              <td className="border px-4 py-2">
                {new Date(o.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
