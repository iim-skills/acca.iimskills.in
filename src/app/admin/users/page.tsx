"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Shield, UserPlus } from "lucide-react";

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
  photo?: string;
  bio?: string;
};

/** Normalize role string for robust comparison */
function normalizeRole(raw?: string) {
  if (!raw) return "";
  return raw
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ") // replace underscores/hyphens with space
    .replace(/\s+/g, " "); // collapse multiple spaces
}

/** Returns true for many possible 'super admin' variants */
function isSuperVariant(raw?: string) {
  const r = normalizeRole(raw);
  return r === "super admin" || r === "superadmin" || r === "sa" || r === "super-admin";
}

export default function AdminUsersPage({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({
    id: null,
    name: "",
    email: "",
    password: "",
    role: "Admin",
    bio: "",
    photo: "",
  });

  // Defensive: normalized role + booleans
  const normalizedRole = normalizeRole(currentUser?.role);
  const isSuperAdmin = isSuperVariant(currentUser?.role);
  const isAdmin = !isSuperAdmin && normalizedRole === "admin";

  // debug output — remove in prod
  useEffect(() => {
    console.log("currentUser (raw):", currentUser);
    console.log(
      "normalizedRole:",
      normalizedRole,
      "isSuperAdmin:",
      isSuperAdmin,
      "isAdmin:",
      isAdmin
    );
  }, [currentUser, normalizedRole, isSuperAdmin, isAdmin]);

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();

      console.log("🧠 FRONTEND RECEIVED:", data);

      if (data && data.success && Array.isArray(data.data)) {
        console.log("✅ USERS SET:", data.data);
        setUsers(data.data);
      } else {
        console.log("❌ INVALID RESPONSE:", data);
        setUsers([]);
      }
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch only when currentUser is available (defensive)
    if (!currentUser) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = async () => {
    if (!isSuperAdmin) {
      alert("Unauthorized — view only.");
      return;
    }

    try {
      const method = editMode ? "PUT" : "POST";
      const bodyPayload = { ...form };
      if (editMode) delete bodyPayload.password;

      const res = await fetch("/api/admin/users", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      alert(data.message || (editMode ? "Updated" : "Created"));
      setShowForm(false);
      setEditMode(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error("handleSubmit error", err);
      alert("Save failed");
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    if (!isSuperAdmin) {
      alert("Unauthorized — view only.");
      return;
    }

    if (!confirm("Delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-role": currentUser?.role || "" },
      });
      const data = await res.json();
      if (!data.success) alert(data.message || "Delete failed");
      fetchUsers();
    } catch (err) {
      console.error("handleDelete error", err);
      alert("Delete failed");
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const handlePassword = async (email: string) => {
    if (!isSuperAdmin) {
      alert("Unauthorized — view only.");
      return;
    }

    const newPass = prompt("Enter new password:");
    if (!newPass) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "",
        },
        body: JSON.stringify({ email, password: newPass }),
      });
      const data = await res.json();
      alert(data.message || "Password updated");
    } catch (err) {
      console.error("handlePassword error", err);
      alert("Password update failed");
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (user: UserRecord) => {
    if (!isSuperAdmin) {
      alert("Unauthorized — view only.");
      return;
    }

    setForm({ ...user, password: "" });
    setEditMode(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ id: null, name: "", email: "", password: "", role: "Admin", bio: "", photo: "" });
  };

  /* ================= RENDER ================= */
  // If currentUser not provided for some reason, show loading
  if (!currentUser) {
    return (
      <div className="p-8 bg-white min-h-screen">
        <div className="text-sm text-gray-600">Loading user...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">User Management</h1>
          <div className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-medium">{currentUser?.name}</span> •{" "}
            <span className="font-medium">{currentUser?.role}</span>
            {isAdmin && (
              <span className="ml-3 px-2 py-1 text-xs bg-yellow-50 text-yellow-800 rounded-full">
                View only
              </span>
            )}
            {!currentUser && (
              <span className="ml-3 px-2 py-1 text-xs bg-red-50 text-red-800 rounded-full">
                No current user
              </span>
            )}
          </div>
        </div>

        {isSuperAdmin ? (
          <button
            onClick={() => {
              resetForm();
              setEditMode(false);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#4338ca] transition-colors"
            title="Add User"
          >
            <UserPlus size={18} />
            Add User
          </button>
        ) : (
          <div className="text-sm text-slate-400 italic">Create / Edit disabled for your role</div>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-gray-200 text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              <th className="px-6 py-4">User Info</th>
              <th className="px-6 py-4">Role / Bio</th>
              <th className="px-6 py-4">Access Level</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                        {u.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.photo} className="w-full h-full object-cover" alt={u.name} />
                        ) : (
                          (u.name?.charAt(0) || "U")
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[#1e293b] text-sm capitalize">{u.name}</div>
                        <div className="text-[12px] text-[#64748b]">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-[13px] text-[#64748b] max-w-xs truncate">
                      {u.bio || <span className="text-gray-300 italic">No description</span>}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        u.role && normalizeRole(u.role) === "super admin"
                          ? "bg-purple-50 text-purple-600 border border-purple-100"
                          : "bg-orange-50 text-orange-600 border border-orange-100"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      {isSuperAdmin ? (
                        <>
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit user"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => handlePassword(u.email)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                            title="Change password"
                          >
                            <Shield size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <div
                          className="flex items-center gap-2 text-slate-300"
                          title="View only — upgrade to Super Admin for actions"
                        >
                          <div className="p-1.5 rounded">
                            <Edit2 size={16} />
                          </div>
                          <div className="p-1.5 rounded">
                            <Shield size={16} />
                          </div>
                          <div className="p-1.5 rounded">
                            <Trash2 size={16} />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reused Side Form Logic (only accessible to Super Admin) */}
      <AnimatePresence>
        {showForm && isSuperAdmin && (
          <>
            <motion.div
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
              onClick={() => setShowForm(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed right-0 top-0 w-full max-w-md h-full bg-white shadow-2xl z-50 p-8"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
            >
              <h2 className="text-xl font-bold mb-6 text-[#1e293b]">
                {editMode ? "Edit User" : "Add New User"}
              </h2>
              <div className="space-y-4">
                <input
                  placeholder="Photo URL"
                  className="w-full border border-gray-200 p-3 rounded-lg text-sm"
                  value={form.photo || ""}
                  onChange={(e) => setForm({ ...form, photo: e.target.value })}
                />
                <input
                  placeholder="Name"
                  className="w-full border border-gray-200 p-3 rounded-lg text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  placeholder="Email"
                  className="w-full border border-gray-200 p-3 rounded-lg text-sm disabled:bg-gray-50"
                  value={form.email}
                  disabled={editMode}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {!editMode && (
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full border border-gray-200 p-3 rounded-lg text-sm"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                )}
                <select
                  className="w-full border border-gray-200 p-3 rounded-lg text-sm bg-white"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option>Admin</option>
                  <option>Super Admin</option>
                </select>
                <textarea
                  placeholder="Bio"
                  className="w-full border border-gray-200 p-3 rounded-lg text-sm h-32"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold"
                >
                  {editMode ? "Update" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditMode(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}