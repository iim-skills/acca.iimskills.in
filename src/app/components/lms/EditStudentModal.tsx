"use client";

import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";

type Props = { email: string; onClose: () => void; onUpdated: () => void; };

type ModuleObj = { moduleId?: string; id?: string|number; slug?: string; name?: string; title?: string; [k:string]: any };
type Batch = { id: string|number; name: string; startDate?: string; maxStudents?: number; currentStudents?: number; };
type StudentRaw = { name?:string; email?:string; courseSlug?:string; course_slug?:string; course?:string; course_title?:string; assignedModules?: any; modules?: any; status?:string; batchId?: any; batch_id?: any; batchName?: any; batch_name?: any; [k:string]: any };

export default function EditStudentModal({ email, onClose, onUpdated }: Props) {

  const [student, setStudent] = useState<StudentRaw | null>(null);
  const [allModules, setAllModules] = useState<ModuleObj[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | number | "">("");

  /* ================= HELPERS ================= */

  const safeParse = (val:any, fallback:any=null) => {
    if (val == null) return fallback;
    if (typeof val === "object") return val;
    try { return JSON.parse(String(val)); } catch { return fallback; }
  };

  const moduleIdOf = (m: ModuleObj | string) => {
    if (typeof m === "string") return String(m);
    return String(m.moduleId ?? m.id ?? m.slug ?? m.name ?? m.title ?? "");
  };

  // stronger normalizer: remove everything except a-z0-9 so comparisons are resilient
  const normalize = (s:any) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();

  const findCourseBySlug = (courses:any[], wanted:any) => {
    if (!wanted || !Array.isArray(courses)) return null;
    const w = normalize(wanted);

    return (
      courses.find((c:any) => normalize(c.slug) === w) ||
      courses.find((c:any) => normalize(c.courseId) === w) ||
      courses.find((c:any) => normalize(c.name) === w) ||
      courses.find((c:any) => normalize(c.title) === w) ||
      null
    );
  };

  const extractModulesFromCourse = (course:any): ModuleObj[] => {
    if (!course) return [];
    if (course.courseData) {
      const cd = safeParse(course.courseData, null);
      if (cd) {
        if (Array.isArray(cd.modules)) return cd.modules;
        if (Array.isArray(cd)) return cd;
      }
    }
    if (Array.isArray(course.modules)) return course.modules;
    if (Array.isArray(course.course_modules)) return course.course_modules;
    if (Array.isArray(course.curriculum)) return course.curriculum;
    return [];
  };

  /* ================= LOAD STUDENT ================= */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setFetching(true);

      try {
        const res = await fetch(`/api/lms/students/by-email?email=${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error("Failed to load student");

        const data: StudentRaw = await res.json();
        if (!mounted) return;

        setStudent(data);
        setStatus(data.status ?? "active");

        const rawAssigned = data.assignedModules ?? data.modules ?? [];
        const assignedArr = Array.isArray(rawAssigned) ? rawAssigned : safeParse(rawAssigned, []);
        setSelectedModules((assignedArr || []).map((it:any)=>moduleIdOf(it)));

        const currentBatchId = data.batch_id ?? data.batchId ?? null;
        if (currentBatchId != null) setSelectedBatchId(String(currentBatchId));

        /* ================= LOAD COURSES + MODULES (RELIABLE MATCH) ================= */

        const cr = await fetch("/api/admin/courses");
        if (cr.ok) {
          const resJson = await cr.json();
          const courses = Array.isArray(resJson) ? resJson : (resJson.rows ?? []);

          // student's course value (raw)
          const studentCourseRaw = (data.courseSlug ?? data.course_slug ?? data.course_title ?? data.course ?? "").toString().trim();

          // normalized wanted
          const wanted = normalize(studentCourseRaw);

          // attempt to find course using multiple candidate fields and flexible matching
          let course: any = null;

          if (wanted) {
            course = courses.find((c:any) => {
              if (!c) return false;
              const candidates = [
                c.slug,
                c.courseId,
                c.id,
                c.name,
                c.title,
                // some systems store display name in other fields; include them defensively
                (c.meta && c.meta.displayName) || c.displayName || null
              ].filter(Boolean).map((x:any) => normalize(x));

              // check equality or inclusion in either direction
              return candidates.some((cand:any) =>
                cand === wanted ||
                cand.includes(wanted) ||
                wanted.includes(cand) ||
                cand.startsWith(wanted) ||
                wanted.startsWith(cand)
              );
            }) ?? null;
          }

          // fallback to existing matcher (keeps backward compatibility)
          if (!course) {
            course = findCourseBySlug(courses, data.courseSlug ?? data.course_slug ?? data.course_title ?? data.course);
          }

          // debug if still not found (you can remove this once verified)
          if (!course) {
            console.debug("EditStudentModal: no course matched student value:", { studentCourseRaw, coursesSample: courses.slice(0,6) });
          }

          const mods = extractModulesFromCourse(course) ?? [];

          const normalizedMods = mods.map((m:any) => ({
            ...(m || {}),
            __moduleIdStr: moduleIdOf(m),
            __label: m.name ?? m.title ?? String(moduleIdOf(m))
          }));

          setAllModules(normalizedMods);
        } else {
          setAllModules([]);
        }

      } catch (err:any) {
        console.error("EditStudentModal load error:", err);
        setError(err?.message ?? "Failed to load data");
      } finally {
        if (mounted) setFetching(false);
      }
    };

    load();
    return ()=>{ mounted=false; };

  }, [email]);

  /* ================= LOAD BATCHES ================= */

  useEffect(() => {
    let mounted = true;

    const loadBatches = async () => {
      try {
        const res = await fetch("/api/admin/batches");
        if (!res.ok) throw new Error("Failed to fetch batches");

        const data: Batch[] = await res.json();
        const arr = Array.isArray(data) ? data : [];

        if (!mounted) return;

        setBatches(arr);

        if (!selectedBatchId && arr.length > 0) {
          const sBid = student?.batch_id ?? student?.batchId ?? null;
          if (sBid != null) setSelectedBatchId(String(sBid));
          else setSelectedBatchId(String(arr[0].id));
        }
      } catch (err) {
        console.error("Load batches error:", err);
      }
    };

    if (student) loadBatches();
    return ()=>{ mounted=false; };

  }, [student]);

  const toggleModule = (id:string) => {
    setSelectedModules(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  };

  const handleSave = async () => {
    if (!student) return;

    setLoading(true);
    setError(null);

    try {
      const modulesPayload = selectedModules.map(id => {
        const found:any = allModules.find(m=>String((m as any).__moduleIdStr)===String(id));
        if (found) {
          const { __moduleIdStr,__label,...rest } = found;
          return rest;
        }
        return { moduleId:id };
      });

      const batch = batches.find(b=>String(b.id)===String(selectedBatchId));

      const payload = {
        email: student.email,
        modules: modulesPayload,
        status,
        batchId: selectedBatchId==="" ? null : Number(selectedBatchId),
        batchName: batch?.name ?? null,
      };

      const res = await fetch("/api/lms/students/by-email",{
        method:"PUT",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(payload)
      });

      if(!res.ok){
        const err=await res.json().catch(()=>null);
        throw new Error(err?.error ?? "Update failed");
      }

      onUpdated();
      onClose();

    } catch(err:any){
      console.error("Save error:",err);
      setError(err?.message ?? "Failed to save");
    } finally{
      setLoading(false);
    }
  };

  if(fetching || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative">

        <button onClick={onClose} className="absolute top-4 right-4"><X/></button>
        <h2 className="text-xl font-bold mb-4">Edit Student</h2>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <div className="space-y-3 text-sm">
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Course:</strong> {student.course ?? student.course_title ?? student.courseSlug}</p>

          {/* BATCH */}
          <div>
            <p className="font-semibold mb-1">Batch</p>
            <select value={String(selectedBatchId)} onChange={(e)=>setSelectedBatchId(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">-- No Batch --</option>
              {batches.map(b=>(
                <option key={String(b.id)} value={String(b.id)}>
                  {b.name} {b.startDate ? `— ${new Date(b.startDate).toLocaleDateString()}`:""}
                </option>
              ))}
            </select>
          </div>

          {/* MODULES */}
          <div>
            <p className="font-semibold mb-2">Assign Modules</p>
            <div className="space-y-2 max-h-48 overflow-auto pr-2">
              {allModules.length===0
                ? <div className="text-slate-500">No modules available</div>
                : allModules.map(m=>{
                    const id=String((m as any).__moduleIdStr);
                    const label=(m as any).__label ?? id;
                    const checked=selectedModules.includes(id);
                    return(
                      <label key={id} className="flex items-center gap-3">
                        <input type="checkbox" checked={checked} onChange={()=>toggleModule(id)} />
                        <span>{label}</span>
                      </label>
                    );
                })}
            </div>
          </div>

          {/* STATUS */}
          <div>
            <p className="font-semibold mb-1">Status</p>
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border rounded px-3 py-1">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-bold disabled:opacity-60">
          <Save size={16}/> {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}