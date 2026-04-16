"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2,
  Trash2,
  Shield,
  UserPlus,
  Search,
  Mail,
  X,
  Loader2,
  User,
} from "lucide-react";

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
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ");
}

/** Returns true for many possible 'super admin' variants */
function isSuperVariant(raw?: string) {
  const r = normalizeRole(raw);
  return r === "super admin" || r === "superadmin" || r === "sa" || r === "super-admin";
}

type FormState = {
  id: number | null;
  name: string;
  email: string;
  password: string;
  role: string;
  bio: string;
  photo: string;
};

const initialForm: FormState = {
  id: null,
  name: "",
  email: "",
  password: "",
  role: "Admin",
  bio: "",
  photo: "",
};

export default function AdminUsersPage({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<FormState>(initialForm);

  const normalizedRole = normalizeRole(currentUser?.role);
  const isSuperAdmin = isSuperVariant(currentUser?.role);
  const isAdmin = !isSuperAdmin && normalizedRole === "admin";

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();

      if (data && data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const resetForm = () => {
    setForm(initialForm);
  };

  const openCreate = () => {
    resetForm();
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = (user: UserRecord) => {
    if (!isSuperAdmin) {
      alert("Unauthorized — view only.");
      return;
    }

    setForm({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "Admin",
      bio: user.bio || "",
      photo: user.photo || "",
    });
    setEditMode(true);
    setShowForm(true);
  };

  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = async () => {
    if (!isSuperAdmin) {
      alert("Unauthorized — view only.");
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      alert("Name and email are required");
      return;
    }

    if (!editMode && !form.password.trim()) {
      alert("Password is required");
      return;
    }

    setSaving(true);
    try {
      const method = editMode ? "PUT" : "POST";
      const bodyPayload: any = {
        id: form.id,
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        bio: form.bio,
        photo: form.photo,
      };

      if (!editMode) bodyPayload.password = form.password;

      const res = await fetch("/api/admin/users", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Save failed");
      }

      alert(data.message || (editMode ? "Updated" : "Created"));
      setShowForm(false);
      setEditMode(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error("handleSubmit error", err);
      alert("Save failed");
    } finally {
      setSaving(false);
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
      if (!data.success) {
        alert(data.message || "Delete failed");
        return;
      }

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

  /* ================= FILTERS / STATS ================= */
  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        (u.bio || "").toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm]);

  const stats = useMemo(() => {
    const superCount = users.filter((u) => isSuperVariant(u.role)).length;
    const adminCount = users.filter((u) => normalizeRole(u.role) === "admin").length;
    return {
      total: users.length,
      admins: adminCount,
      superAdmins: superCount,
    };
  }, [users]);

  /* ================= RENDER ================= */
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-8">
        <div className="text-sm text-gray-600">Loading user...</div>
      </div>
    );
  }

  return (
    <div className="  bg-[#f8fafc] px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 overflow-x-hidden">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
         

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard title="Total Users" value={stats.total} />
          <StatCard title="Super Admins" value={stats.superAdmins} />
          <StatCard title="Admins" value={stats.admins} />
          
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-50 p-6 md:flex-row md:items-center bg-white rounded-t-[2rem] border border-slate-200/60 border-b-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Admin Management
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
              />
            </div>

            {isSuperAdmin ? (
              <button
                onClick={openCreate}
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#4f46e5] text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-[#4338ca] transition-all active:scale-[0.98] text-sm sm:text-base min-h-[44px]"
                title="Add User"
              >
                <UserPlus size={18} />
                <span className="hidden sm:inline">Add User</span>
                <span className="sm:hidden">Add</span>
              </button>
            ) : (
              <div className="hidden sm:block text-sm text-slate-400 italic">
                Create / Edit disabled for your role
              </div>
            )}
          </div>
        </div>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
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
                    <td colSpan={4} className="text-center py-14 text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={18} />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-14 text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                            {u.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.photo}
                                className="w-full h-full object-cover"
                                alt={u.name}
                              />
                            ) : (
                              (u.name?.charAt(0) || "U")
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#1e293b] text-sm capitalize truncate">
                              {u.name}
                            </div>
                            <div className="text-[12px] text-[#64748b] flex items-center gap-1 truncate">
                              <Mail size={12} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-[13px] text-[#64748b] truncate">
                            {u.bio || <span className="text-gray-300 italic">No description</span>}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                            isSuperVariant(u.role)
                              ? "bg-purple-50 text-purple-600 border-purple-100"
                              : "bg-orange-50 text-orange-600 border-orange-100"
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

          {/* Mobile / Tablet Cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-20 text-center text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-3" size={24} />
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 px-6">
                No users found.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="p-4 sm:p-5 active:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                        {u.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.photo}
                            className="w-full h-full object-cover"
                            alt={u.name}
                          />
                        ) : (
                          (u.name?.charAt(0) || "U")
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate capitalize">
                          {u.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <Mail size={12} /> {u.email}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isSuperVariant(u.role)
                                ? "bg-purple-50 text-purple-600 border-purple-100"
                                : "bg-orange-50 text-orange-600 border-orange-100"
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSuperAdmin ? (
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg shrink-0"
                      >
                        <Edit2 size={16} />
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Bio
                      </p>
                      <p className="text-sm text-slate-700 mt-1 line-clamp-2">
                        {u.bio || <span className="text-slate-300 italic">No description</span>}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Access Level
                      </p>
                      <p className="text-sm text-slate-700 mt-1 font-semibold">{u.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4">
                    {isSuperAdmin ? (
                      <>
                        <button
                          onClick={() => handlePassword(u.email)}
                          className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold border border-slate-200"
                        >
                          <Shield size={14} className="inline-block mr-1" />
                          Password
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold border border-red-100"
                        >
                          <Trash2 size={14} className="inline-block mr-1" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">View only</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DRAWER FORM */}
        <AnimatePresence>
          {showForm && isSuperAdmin && (
            <>
              <motion.div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
                onClick={() => {
                  setShowForm(false);
                  setEditMode(false);
                  resetForm();
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              <motion.div
                className="fixed right-0 top-0 w-full max-w-md h-full bg-white shadow-2xl z-50 overflow-y-auto"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 220, damping: 25 }}
              >
                <div className="sticky top-0 bg-white border-b border-slate-100 px-5 sm:px-8 py-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black mb-1 text-[#1e293b]">
                      {editMode ? "Edit User" : "Add New User"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {editMode ? "Update user details below." : "Create a new user account."}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditMode(false);
                      resetForm();
                    }}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 sm:p-8 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                      <User size={12} /> Photo URL
                    </label>
                    <input
                      placeholder="Photo URL"
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                      value={form.photo}
                      onChange={(e) => setForm({ ...form, photo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                      <User size={12} /> Name
                    </label>
                    <input
                      placeholder="Name"
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                      <Mail size={12} /> Email
                    </label>
                    <input
                      placeholder="Email"
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm disabled:bg-gray-50 outline-none focus:ring-4 focus:ring-indigo-500/10"
                      value={form.email}
                      disabled={editMode}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  {!editMode && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                        <Shield size={12} /> Password
                      </label>
                      <input
                        type="password"
                        placeholder="Password"
                        className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                      <Shield size={12} /> Role
                    </label>
                    <select
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white outline-none focus:ring-4 focus:ring-indigo-500/10"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option>Admin</option>
                      <option>Super Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                      <Edit2 size={12} /> Bio
                    </label>
                    <textarea
                      placeholder="Bio"
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm h-32 outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="animate-spin" size={16} /> : null}
                      {editMode ? "Update" : "Save"}
                    </button>

                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditMode(false);
                        resetForm();
                      }}
                      className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-[1.5rem] shadow-sm border border-slate-200/60">
      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {title}
      </p>
      <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mt-2">
        {value}
      </p>
    </div>
  );
}