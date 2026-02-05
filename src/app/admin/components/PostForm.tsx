"use client";

import { useState } from "react";

type PostFormProps = {
  mode: "new" | "edit";
  post?: {
    title: string;
    slug: string;
    author: string;
    category: string[];
    status: "published" | "draft" | "trash";
  };
  onClose: () => void;
};

export default function PostForm({ mode, post, onClose }: PostFormProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [author, setAuthor] = useState(post?.author || "");
  const [category, setCategory] = useState(post?.category.join(", ") || "");
  const [status, setStatus] = useState(post?.status || "draft");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      title,
      author,
      category: category.split(",").map((c) => c.trim()),
      status,
      slug: post?.slug || title.toLowerCase().replace(/\s+/g, "-"),
    };

    await fetch("/api/admin/save-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, post: payload }),
    });

    onClose(); // close drawer
    location.reload(); // refresh posts list
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        placeholder="Category (comma separated)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as any)}
        className="w-full border p-2 rounded"
      >
        <option value="published">Published</option>
        <option value="draft">Draft</option>
        <option value="trash">Trash</option>
      </select>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save
        </button>
      </div>
    </form>
  );
}
