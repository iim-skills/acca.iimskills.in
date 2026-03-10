declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export function metaLeadEvent(params: {
  content_name: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) {
  if (typeof window === "undefined") return null;
  if (typeof window.fbq !== "function") return null;

  const eventID = `lead_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  window.fbq(
    "track",
    "Lead",
    {
      content_name: params.content_name,
      content_category: params.content_category || "Education",
      value: params.value ?? 0,
      currency: params.currency || "INR",
    },
    { eventID }
  );

  return eventID; // 🔥 for deduplication / future CAPI
}
