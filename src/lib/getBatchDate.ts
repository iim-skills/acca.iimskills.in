import { getNextWeekdayDate, isDateInPast } from "./date";

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th"; // 11th–20th
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function prettyDateWithOrdinal(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Coming Soon";

  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" }); // e.g. Oct
  const suffix = getOrdinalSuffix(day);

  return `${day}${suffix} ${month}`; // e.g. 11th Oct
}

export async function getBatchDate(courseKey: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/batch-dates`, {
      cache: "no-store",
    });
    const data = await res.json();
    const saved = data?.[courseKey];
    if (!saved) return "Coming Soon";

    const date = saved?.date?.split("T")[0];
    const weekday = saved?.targetWeekday ?? 6;

    let displayDate: string;
    if (saved.mode === "manual" && date) {
      displayDate = isDateInPast(date)
        ? getNextWeekdayDate(weekday)
        : date;
    } else if (saved.mode === "auto") {
      displayDate = getNextWeekdayDate(weekday);
    } else {
      displayDate = date || getNextWeekdayDate(weekday);
    }

    return prettyDateWithOrdinal(displayDate);
  } catch (err) {
    console.error("getBatchDate error:", err);
    return "Coming Soon";
  }
}
