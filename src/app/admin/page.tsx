"use client";

import { useEffect, useState } from "react";
import {
  FaFolderOpen,
  FaChartBar,
  FaSignOutAlt,
} from "react-icons/fa";
import { User2 } from "lucide-react";

import LMSPage from "./StudentLIst";
import DashboardHome from "./components/DashboardHome";
import ProfilePage from "./profile/page";

/* ================= TYPES ================= */
export interface User {
  id: number;
  name: string;
  email?: string;
}

/* ================= COMPONENT ================= */
export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState<User | null>(null);

  /* ---------- LOAD & PROTECT ADMIN ---------- */
  useEffect(() => {
    const stored =
      sessionStorage.getItem("user") ?? localStorage.getItem("user");

    if (!stored) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      // 🚫 BLOCK NON-ADMINS (students)
      if (parsed.loginType !== "admin") {
        window.location.href = "/student/dashboard";
        return;
      }

      setUser({
        id: Number(parsed.id),
        name: parsed.name,
        email: parsed.email,
      });
    } catch {
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      window.location.href = "/admin/login";
    }
  }, []);

  if (!user) return null;

  /* ---------- TABS ---------- */
  const tabs = [
    { key: "dashboard", name: "Dashboard", icon: <FaChartBar className="mr-2" /> },
    { key: "lms", name: "LMS", icon: <FaFolderOpen className="mr-2" /> },
    { key: "profile", name: "My Profile", icon: <User2 className="mr-2" /> },
  ];

  /* ---------- RENDER ---------- */
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-72 bg-gray-100 p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-4">⚙️ ACCA IIM SKILLS</h1>
          <p className="text-sm text-gray-600 mb-6">
            Logged in as <strong>{user.name}</strong>
          </p>

          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.key}>
                <button
                  onClick={() => setActive(tab.key)}
                  className={`flex items-center w-full px-3 py-2 rounded-lg ${
                    active === tab.key
                      ? "bg-blue-600 text-white"
                      : "hover:bg-blue-50 text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* LOGOUT */}
        <button
          onClick={() => {
            sessionStorage.removeItem("user");
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
          className="flex items-center px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg"
        >
          <FaSignOutAlt className="mr-2" />
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 overflow-y-auto">
        {active === "dashboard" && <DashboardHome />}
        {active === "lms" && <LMSPage />}
        {active === "profile" && <ProfilePage />}
      </main>
    </div>
  );
}
