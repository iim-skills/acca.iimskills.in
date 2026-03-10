// lib/date.ts
export function formatLocalDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // YYYY-MM-DD
}

export function getNextWeekdayDate(weekday: number, fromDate?: Date) {
  const today = fromDate ? new Date(fromDate) : new Date();
  const result = new Date(today);
  // calculate days until next occurrence (not today)
  const daysUntil = (7 + weekday - today.getDay()) % 7 || 7;
  result.setDate(today.getDate() + daysUntil);
  return formatLocalDate(result);
}

export function isDateInPast(dateStr?: string) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today;
}

/**
 * prettyDate: converts "YYYY-MM-DD" -> "DD Mon YYYY" (locale aware)
 * Example: "2025-10-11" -> "11 Oct 2025"
 */
export function prettyDate(dateStr: string) {
  if (!dateStr) return "";
  // Ensure we parse in local timezone by providing a midnight time
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
