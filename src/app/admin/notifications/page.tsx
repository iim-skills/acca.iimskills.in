"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit3, Send, Plus, X, Loader2 } from "lucide-react";

/* ✅ ADD TYPES */
type Notification = {
  id: number;
  title: string;
  message: string;
  created_at?: string;
};

export default function AdminNotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = async () => {
    if (!title || !message) return;

    const url = "/api/admin/notifications";
    const method = editingId ? "PUT" : "POST";

    const body = editingId
      ? { id: editingId, title, message }
      : { title, message };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchNotifications();
        closeDrawer();
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;

    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) fetchNotifications();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  /* ================= DRAWER ================= */
  const openDrawer = (notif: Notification | null = null) => {
    if (notif) {
      setEditingId(notif.id);
      setTitle(notif.title);
      setMessage(notif.message);
    } else {
      setEditingId(null);
      setTitle("");
      setMessage("");
    }
    setIsOpen(true);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    setTitle("");
    setMessage("");
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Broadcasts
            </h1>
            <p className="text-slate-500 mt-1">
              Manage live notifications for your application users.
            </p>
          </div>

          <button
            onClick={() => openDrawer()}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-indigo-100 font-bold"
          >
            <Plus size={20} /> Create Notification
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p>Loading notifications...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notifications.length === 0 && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                No notifications found. Start by creating one!
              </div>
            )}

            {notifications.map((notif) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={notif.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-xl text-slate-800">
                    {notif.title}
                  </h3>
                  <p className="text-slate-500 line-clamp-2 max-w-2xl">
                    {notif.message}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openDrawer(notif)}
                    className="p-3 hover:bg-indigo-50 text-indigo-600 rounded-2xl transition-colors"
                  >
                    <Edit3 size={20} />
                  </button>

                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-3 hover:bg-red-50 text-red-500 rounded-2xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 p-10 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black">
                  {editingId ? "Update" : "New"} Blast
                </h2>
                <button
                  onClick={closeDrawer}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8 flex-1">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50"
                  placeholder="Title"
                />

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 h-64"
                  placeholder="Message"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl mt-6"
              >
                <Send size={20} /> {editingId ? "Save Changes" : "Send Notification"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}