export async function sendToHubspot({
  name, email, phone, courseSlug, source,
}: { name?: string; email: string; phone?: string; courseSlug: string; source?: string; }) {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) return;

  const create = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: { email, firstname: name || "", phone: phone || "", free_course_slug: courseSlug, source: source || "Intake" },
    }),
  });

  if (!create.ok) {
    const search = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
        properties: ["email"], limit: 1,
      }),
    });
    const sdata = await search.json().catch(() => ({}));
    const id = sdata?.results?.[0]?.id;
    if (id) {
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ properties: { firstname: name || "", phone: phone || "", free_course_slug: courseSlug, source: source || "Intake" } }),
      });
    }
  }
}
