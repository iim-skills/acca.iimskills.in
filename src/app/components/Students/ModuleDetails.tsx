// components/Students/ModuleDetails.tsx
"use client";

import React from "react";
import type { CourseFile, StudentAPIResp, Module, Submodule } from "./types";
import { Play, Lock, Film } from "lucide-react";
import { parseStudentModules, toPlayableUrl } from "./utils";

type Props = {
  course?: CourseFile | null;
  student: StudentAPIResp;
  activeModuleId: string | null;
  activeSubmoduleTitle: string | null;
  setActiveModuleId: (id: string | null) => void;
  setActiveVideoUrl: (url: string | null) => void;
  setActiveSubmoduleTitle: (t: string | null) => void;
  findGlobalIndexByUrl: (url?: string | null) => number;
  setActiveGlobalIndex: (n: number | null) => void;
};

export default function ModuleDetails({
  course,
  student,
  activeModuleId,
  activeSubmoduleTitle,
  setActiveModuleId,
  setActiveVideoUrl,
  setActiveSubmoduleTitle,
  findGlobalIndexByUrl,
  setActiveGlobalIndex,
}: Props) {
  const mod: Module | undefined = course?.modules?.find((m) => {
    const idRaw = m.moduleId ?? m.slug ?? m.name;
    return idRaw ? String(idRaw) === activeModuleId : false;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{mod ? mod.name : "Module details"}</h3>
      <p className="text-sm text-slate-600 mb-3">{mod ? mod.description : "Select a module on the left to view details and play videos."}</p>

      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2">Submodules</h4>
        <div className="space-y-2">
          {!mod?.submodules?.length && <div className="text-sm text-slate-500">No submodules listed.</div>}
          {mod?.submodules?.map((s: Submodule) => {
            const moduleIdRaw = mod.moduleId ?? mod.slug ?? mod.name;
            const moduleId = moduleIdRaw ? String(moduleIdRaw) : "";
            const isActive = parseStudentModules(student.modules).includes(moduleId);
            const firstVideo = s.videos?.[0]?.url ?? null;
            return (
              <div key={s.submoduleId ?? s.title} className={`w-full`}>
                <button
                  onClick={() => {
                    if (!isActive) return;
                    setActiveModuleId(moduleId);
                    setActiveVideoUrl(toPlayableUrl(firstVideo));
                    setActiveSubmoduleTitle(s.title ?? null);
                    const gIdx = findGlobalIndexByUrl(firstVideo);
                    setActiveGlobalIndex(gIdx >= 0 ? gIdx : null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border ${isActive ? "hover:bg-indigo-50" : "opacity-60 cursor-not-allowed"}`}
                  disabled={!isActive}
                  aria-label={`Open submodule ${s.title}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.title}</div>
                      <div className="text-xs text-slate-400">{s.description}</div>
                    </div>
                    <div className="ml-4">{isActive ? <Play size={16} /> : <Lock size={16} />}</div>
                  </div>
                </button>

                {isActive && s.videos && s.videos.length > 0 && activeSubmoduleTitle === s.title && (
                  <div className="mt-2 space-y-1 ml-4">
                    {s.videos.map((v) => (
                      <button
                        key={v.id ?? v.title}
                        onClick={() => {
                          setActiveVideoUrl(toPlayableUrl(v.url ?? null));
                          setActiveSubmoduleTitle(s.title ?? null);
                          const gIdx = findGlobalIndexByUrl(v.url ?? null);
                          setActiveGlobalIndex(gIdx >= 0 ? gIdx : null);
                        }}
                        className="text-sm text-indigo-600 hover:underline"
                        aria-label={`Play ${v.title}`}
                      >
                        ▶ {v.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}