// components/Students/ModuleAccess.tsx
"use client";

import React from "react";
import type { CourseFile, StudentAPIResp } from "./types";
import { parseStudentModules } from "./utils";

type Props = {
  course?: CourseFile | null;
  student: StudentAPIResp;
};

export default function ModuleAccess({ course, student }: Props) {
  const moduleSlice = course?.modules?.slice(0, 6) ?? [];
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <h4 className="text-sm font-semibold mb-2">Module access</h4>
      <div className="text-xs text-slate-500 mb-3">Only modules assigned to you are playable. Locked modules are visible but inaccessible.</div>

      <div className="flex flex-col gap-2">
        {moduleSlice.map((m) => {
          const idRaw = m.moduleId ?? m.slug ?? m.name;
          const id = idRaw ? String(idRaw) : "";
          const isActive = parseStudentModules(student.modules).includes(id);
          return (
            <div key={String(id)} className="flex items-center justify-between text-sm">
              <div className="truncate">{m.name}</div>
              <div className={`text-xs font-semibold ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                {isActive ? "Active" : "Locked"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}