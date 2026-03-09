// src/components/progressService.ts
export const GUEST_PROGRESS_KEY = (courseId: string) => `guest_progress_${courseId || "unknown_course"}`;

export function getUserKey(): string {
  try {
    let userKey = localStorage.getItem("course_user_key");
    if (!userKey) {
      userKey = crypto.randomUUID();
      localStorage.setItem("course_user_key", userKey);
    }
    return userKey;
  } catch {
    return `guest-${Date.now()}`;
  }
}

export async function fetchServerProgress(courseId: string, userKey: string) {
  try {
    const res = await fetch(`/api/course_progress?courseId=${encodeURIComponent(courseId)}&userKey=${encodeURIComponent(userKey)}`);
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch (err) {
    console.warn("fetchServerProgress error", err);
    return [];
  }
}

export async function saveProgressToServer(payload: any) {
  try {
    const res = await fetch(`/api/course_progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("saveProgressToServer error", err);
    throw err;
  }
}

export function persistGuestProgressToLocal(courseId: string, arr: number[]) {
  try { localStorage.setItem(GUEST_PROGRESS_KEY(courseId), JSON.stringify(arr)); } catch (e) { }
}

export function loadGuestProgressFromLocal(courseId: string): number[] {
  try {
    const raw = localStorage.getItem(GUEST_PROGRESS_KEY(courseId));
    if (!raw) return [];
    return JSON.parse(raw) as number[];
  } catch { return []; }
}