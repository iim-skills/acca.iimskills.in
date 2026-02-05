"use client";

import { useEffect, useState } from "react";
import {
  FaFolderOpen,
  FaUserEdit,
  FaEdit,
  FaChartBar,
} from "react-icons/fa";

// Import admin pages
 
import AuthorPage from "./users/page";

export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      window.location.href = "/admin/login";
    }
  }, []);

  if (!user) return <p>Loading...</p>;

  // Define tabs
  const allTabs = [
    { key: "dashboard", name: "Dashboard", icon: <FaChartBar className="mr-2" /> },
    { key: "posts", name: "Posts", icon: <FaEdit className="mr-2" /> },
    { key: "category", name: "Categories", icon: <FaFolderOpen className="mr-2" /> },
    { key: "author", name: "Users", icon: <FaUserEdit className="mr-2" /> },
  ];

  // Role-based filtering
  const visibleTabs =
    user.role === "admin"
      ? allTabs
      : allTabs.filter((tab) => ["posts"].includes(tab.key));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-6">⚙️ IIM SKILLS</h1>
        <p className="mb-4 text-sm text-gray-600">
          Logged in as: <strong>{user.name}</strong> ({user.role})
        </p>
        <ul className="space-y-2">
          {visibleTabs.map((page) => (
            <li key={page.key}>
              <button
                onClick={() => setActive(page.key)}
                className={`flex items-center w-full text-left px-3 py-2 rounded-lg ${
                  active === page.key
                    ? "bg-blue-600 text-white"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
              >
                {page.icon}
                {page.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {active === "author" && <AuthorPage />}
      </div>
    </div>
  );
}
