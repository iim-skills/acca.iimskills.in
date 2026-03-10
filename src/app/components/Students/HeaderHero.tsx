// components/Students/HeaderHero.tsx
"use client";

import React from "react";
import { User, Mail, Phone, LogOut, BookOpen, List } from "lucide-react";
import type { StudentAPIResp, CourseFile } from "./types";
import { useRouter } from "next/navigation";

type Props = {
  student: StudentAPIResp;
  course?: CourseFile | null;
};

export default function HeaderHero({ student, course }: Props) {
  const router = useRouter();

  return (
    <div className="max-w-full mx-auto mb-8 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white shadow-lg overflow-hidden">
      <div className="max-w-7xl  mx-auto p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 rounded-full p-4">
            <User size={36} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{student.name}</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm md:text-base opacity-90">{student.courseTitle ?? "Your Course"}</p>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{course?.modules?.length ?? 0} modules</span>
            </div>
            <div className="mt-2 text-sm flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Mail size={14} /> <span className="text-sm">{student.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} /> <span className="text-sm">{student.phone ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/");
            }}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2"
            aria-label="Logout"
          >
            <LogOut size={16} /> Logout
          </button>
          <div className="hidden md:flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <BookOpen size={16} /> {course?.name ?? "Course"}
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <List size={16} /> {course?.modules?.length ?? 0} modules
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}