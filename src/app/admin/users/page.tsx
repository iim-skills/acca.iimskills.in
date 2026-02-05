"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  posts?: number;
  bio?: string;
  photo?: string;
}

const USERS_PER_PAGE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "author",
    bio: "",
    photo: "",
  });

  // Fetch users with abort support
  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { signal });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch users");
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // handle abort separately
      if (err?.name === "AbortError") {
        return;
      }
      console.error("Error fetching users:", err);
      setError(String(err?.message ?? err));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchUsers(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchUsers]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        bio: formData.bio,
        photo: formData.photo,
      };

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to add user");
      }

      // refetch users (no abort signal needed here)
      await fetchUsers();
      setShowForm(false);
      setFormData({
        username: "",
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "author",
        bio: "",
        photo: "",
      });
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error adding user:", err);
      alert(String(err?.message ?? "Error adding user"));
    } finally {
      setLoading(false);
    }
  };

  // Filter + Search safely (memoized)
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const roleMatch = filterRole === "all" || u.role === filterRole;
      const searchMatch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));
      return roleMatch && searchMatch;
    });
  }, [users, search, filterRole]);

  // Pagination logic (memoized)
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
      ),
    [filteredUsers, currentPage]
  );

  const roles = useMemo(
    () => ["all", "admin", "editor", "author", "contributor", "subscriber", "manager"],
    []
  );

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    roles.forEach((r) => {
      counts[r] = r === "all" ? users.length : users.filter((u) => u.role === r).length;
    });
    return counts;
  }, [users, roles]);

  // Delete user
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete");
      }
      await fetchUsers();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(String(err?.message || "Delete failed"));
    } finally {
      setLoading(false);
    }
  };

  // helper for img fallback
  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = "/user.jpg";
  };

  return (
    <div className="flex h-screen">
      {/* Left: User list */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Users</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            aria-haspopup="dialog"
          >
            + Add User
          </button>
        </div>

        {/* Top bar */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          {/* Role Filters */}
          <div className="flex flex-wrap gap-3 text-sm">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => {
                  setFilterRole(role);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded ${
                  filterRole === role ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)} ({roleCounts[role] ?? 0})
              </button>
            ))}
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search users…"
              className="border px-3 py-2 w-64 rounded"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search users"
            />
          </div>
        </div>

        {/* Loading / Error */}
        {loading && <div className="mb-4 text-sm text-gray-600">Loading...</div>}
        {error && <div className="mb-4 text-sm text-red-600">Error: {error}</div>}

        {/* User list */}
        <div className="border border-gray-200 rounded-md divide-y">
          {paginatedUsers.length === 0 && !loading ? (
            <div className="p-4 text-gray-600">No users found.</div>
          ) : (
            paginatedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
              >
                <img
                  src={user.photo || "/user.jpg"}
                  alt={user.name || user.username}
                  onError={onImgError}
                  className="w-12 h-12 rounded-full object-cover border"
                />
                <div className="flex-1">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-gray-600">
                    {user.username} — {user.email}
                  </div>
                </div>
                <div className="w-28 text-sm capitalize text-gray-700">{user.role}</div>
                <div className="w-16 text-sm text-gray-700 text-center">{user.posts || 0}</div>
                <div className="space-x-2">
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => {
                      setFormData((s) => ({
                        ...s,
                        username: user.username,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        bio: user.bio || "",
                        photo: user.photo || "",
                        password: "",
                        confirmPassword: "",
                      }));
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline text-sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-6">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border rounded disabled:opacity-50"
              aria-disabled={currentPage === 1}
            >
              Prev
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 border rounded disabled:opacity-50"
              aria-disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Slide-in Add/Edit User form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-[400px] bg-gray-50 shadow-lg p-6 h-full fixed right-0 top-0 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-semibold mb-4">Add / Edit User</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required={!formData.username}
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required={!formData.username}
              />
              <textarea
                name="bio"
                placeholder="User Bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows={3}
              />
              <input
                type="text"
                name="photo"
                placeholder="Photo URL"
                value={formData.photo}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="author">Author</option>
                <option value="contributor">Contributor</option>
                <option value="subscriber">Subscriber</option>
                <option value="manager">Manager</option>
              </select>

              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
