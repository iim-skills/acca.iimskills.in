"use client";

import { useState, useRef } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "author" | "HOD";
  bio?: string;
  photo?: string;
  password?: string;
};

export default function UserProfile({
  user,
  loggedInUserRole,
}: {
  user: User;
  loggedInUserRole: "admin" | "author" | "HOD";
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || "",
    password: user.password || "",
  });
  const [photoPreview, setPhotoPreview] = useState(user.photo || "/uploads/default-user.png");
  const [message, setMessage] = useState("");
  const photoRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const canEditAll = loggedInUserRole === "admin";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setMessage("");
    if (!form.id || !form.name || !form.email || !form.role) {
      setMessage("❌ ID, Name, Email, and Role are required.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("id", form.id.toString());
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("role", form.role);
    formData.append("bio", form.bio);
    formData.append("password", form.password);

    if (photoRef.current?.files?.[0]) {
      formData.append("photo", photoRef.current.files[0]);
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Profile updated successfully!");
        setIsEditing(false);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">User Profile</h2>

      <div className="flex flex-col items-center mb-6">
        <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300">
          <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
        </div>
        {isEditing && canEditAll && (
          <label className="mt-2 cursor-pointer text-blue-600 hover:underline">
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            Change Photo
          </label>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          ) : (
            <p>{form.name}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Email</label>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded ${!canEditAll ? "bg-gray-100 cursor-not-allowed" : ""}`}
              disabled={!canEditAll}
            />
          ) : (
            <p>{form.email}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Role</label>
          {isEditing ? (
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded ${!canEditAll ? "bg-gray-100 cursor-not-allowed" : ""}`}
              disabled={!canEditAll}
            >
              <option value="admin">Admin</option>
              <option value="author">Author</option>
              <option value="HOD">HOD</option>
            </select>
          ) : (
            <p>{form.role}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Bio</label>
          {isEditing ? (
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              rows={3}
            />
          ) : (
            <p>{form.bio || "-"}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Password</label>
          {isEditing ? (
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="Change password"
            />
          ) : (
            <p>********</p>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <button
            className={`bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ${
              isEditing ? "bg-red-500 hover:bg-red-600" : ""
            }`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>

          {isEditing && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Update Profile"}
            </button>
          )}
        </div>

        {message && <p className="mt-2 text-green-600">{message}</p>}
      </div>
    </div>
  );
}
