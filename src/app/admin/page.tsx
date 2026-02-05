"use client";

import { useEffect, useState } from "react";
import {
  FaPlusCircle,
  FaFolderOpen,
  FaUserEdit,
  FaChartBar,
  FaCalendarAlt,
  FaSignOutAlt,
  FaMoneyBill,
  FaTicketAlt,
  FaCertificate,
} from "react-icons/fa";
import { LiaLinkedin } from "react-icons/lia";
import { User2 } from "lucide-react";
import LMSPage from "./LMSPage";
import DashboardHome from "./components/DashboardHome";
 
import ProfilePage from "./profile/page";

/* ================= TYPES ================= */
type UserRole = "admin" | "author";

export interface User {
  id: number;
  name: string;
  role: UserRole;
  email?: string;
}

/* ================= COMPONENT ================= */
export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [errorTab, setErrorTab] = useState<string | null>(null);

  /* ---------- LOAD USER ---------- */
  useEffect(() => {
    const stored = sessionStorage.getItem("user") ?? localStorage.getItem("user");

    if (!stored) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const userData = parsed.user ?? parsed;

      setUser({
        id: Number(userData.id),
        name: userData.name,
        role: userData.role,
        email: userData.email,
      });
    } catch {
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      window.location.href = "/admin/login";
    }
  }, []);

  if (!user) return null;

  /* ---------- ALL TABS ---------- */
  const allTabs = [
    { key: "dashboard", name: "Dashboard", icon: <FaChartBar className="mr-2" /> },
    { key: "lms", name: "LMS", icon: <FaFolderOpen className="mr-2" /> },
    { key: "profile", name: "My Profile", icon: <User2 className="mr-2" /> },
  ];

  /* ---------- ROLE ACCESS ---------- */
  const allowedTabs =
    user.role === "admin"
      ? allTabs.map((t) => t.key)
      : ["dashboard", "post", "category", "profile"]; // AUTHOR

  const handleTabClick = (key: string) => {
    if (allowedTabs.includes(key)) {
      setActive(key);
      setErrorTab(null);
    } else {
      setErrorTab(key);
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-72 bg-gray-100 p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-4">⚙️ ACCA IIM SKILLS</h1>
          <p className="text-sm text-gray-600 mb-6">
            Logged in as <strong>{user.name}</strong> ({user.role})
          </p>

          <ul className="space-y-2">
            {allTabs.map((tab) => (
              <li key={tab.key}>
                <button
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center w-full px-3 py-2 rounded-lg ${
                    active === tab.key
                      ? "bg-blue-600 text-white"
                      : "hover:bg-blue-50 text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>

                {errorTab === tab.key && (
                  <p className="text-xs text-red-600 ml-8 mt-1">
                    🚫 Not allowed
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* LOGOUT */}
        <button
          onClick={() => {
            sessionStorage.removeItem("user");
            localStorage.removeItem("user");
            window.location.href = "/admin/login";
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
