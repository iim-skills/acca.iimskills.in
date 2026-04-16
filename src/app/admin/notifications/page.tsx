"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit3, Send, Plus, X, Loader2, Search } from "lucide-react";

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

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

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

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) return;

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
      } else {
        console.error("Save failed");
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchNotifications();
      } else {
        console.error("Delete failed");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

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

  const filteredNotifications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notifications;

    return notifications.filter(
      (notif) =>
        notif.title.toLowerCase().includes(q) ||
        notif.message.toLowerCase().includes(q)
    );
  }, [notifications, search]);

  return (
    <div className=" bg-slate-50 p-6 md:px-12 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto">
       

        <div className="flex flex-col justify-between gap-4 border-b border-gray-50 p-6 md:flex-row md:items-center bg-white rounded-t-[2rem] border border-slate-200/60 border-b-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Notification Management
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px]">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all text-sm"
              />
            </div>

            <button
              onClick={() => openDrawer()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              <span>New Notification</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p>Loading notifications...</p>
          </div>
        ) : (
          <div className="bg-white rounded-b-[2rem] border border-slate-200/60 border-t-0 overflow-hidden">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                No notifications found. Start by creating one!
              </div>
            ) : (
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">
                        Title
                      </th>
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">
                        Content
                      </th>
                      <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">
                    {filteredNotifications.map((notif) => (
                      <tr key={notif.id} className="bg-white">
                        <td className="px-8 py-5 font-semibold text-slate-900">
                          {notif.title}
                        </td>
                        <td className="px-8 py-5 text-slate-600">
                          {notif.message}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openDrawer(notif)}
                              className="p-3 hover:bg-indigo-50 text-indigo-600 rounded-2xl transition-colors"
                              aria-label="Edit notification"
                            >
                              <Edit3 size={20} />
                            </button>

                            <button
                              onClick={() => handleDelete(notif.id)}
                              className="p-3 hover:bg-red-50 text-red-500 rounded-2xl transition-colors"
                              aria-label="Delete notification"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

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
                  {editingId ? "Update" : "New"} Notification
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
                  className="w-full p-4 rounded-2xl bg-slate-50 outline-none border border-transparent focus:border-indigo-300"
                  placeholder="Title"
                />

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 h-64 outline-none border border-transparent focus:border-indigo-300 resize-none"
                  placeholder="Message"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl mt-6 flex items-center justify-center gap-2 font-semibold"
              >
                <Send size={20} />
                {editingId ? "Save Changes" : "Send Notification"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}