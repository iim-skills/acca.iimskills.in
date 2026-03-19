"use client";

import { useState, useEffect } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateNewCourse({
  isOpen,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= AUTO RESET ================= */
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setSlug("");
      setLoading(false);
    }
  }, [isOpen]);

  /* ================= HIDE ================= */
  if (!isOpen) return null;

  /* ================= CREATE ================= */
  const createCourse = async () => {
    if (!name.trim()) {
      alert("Please enter course name");
      return;
    }

    try {
      setLoading(true);

      await fetch("/api/admin/createNewCourse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      onCreated(); // reload courses
      onClose();   // close modal
    } catch (err) {
      console.error(err);
      alert("Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose} // close on outside click
    >
      {/* MODAL BOX */}
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4"
        onClick={(e) => e.stopPropagation()} // prevent close on inside click
      >
        <h2 className="text-lg font-bold">Create New Course</h2>

        {/* COURSE NAME */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Course Name
          </label>
          <input
            value={name}
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              setSlug(val.toLowerCase().replace(/\s+/g, "-"));
            }}
            placeholder="Enter course name"
            className="w-full border px-3 py-2 rounded mt-1"
            autoFocus
          />
        </div>

        {/* SLUG */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Slug
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="course-slug"
            className="w-full border px-3 py-2 rounded mt-1"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={createCourse}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            {loading ? "Creating..." : "Create Course"}
          </button>
        </div>
      </div>
    </div>
  );
}