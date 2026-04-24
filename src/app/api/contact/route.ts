export const runtime = "nodejs";

import { NextResponse } from "next/server";

/* ---------------- HELPERS ---------------- */

function looksLikeEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

function looksLikePhone(phone: string) {
  const digits = phone?.replace(/\D/g, "") || "";
  return digits.length >= 6 && digits.length <= 15;
}

/* ---------------- API ---------------- */

export async function POST(req: Request) {
  try {
    console.log("🚀 API HIT");

    const body = await req.json();
    console.log("📥 Incoming:", body);

    const name = body.name || body.firstname || "";
    const email = body.email;
    const phone = body.phone;

    const productId = body.productId || "FACCA";

    const utmSource = body.utmSource || "";
    const utmMedium = body.utmMedium || "";
    const utmCampaign = body.utmCampaign || "";
    const utmTerm = body.utmTerm || "";
    const utmContent = body.utmContent || "";

    console.log("🧾 Parsed:", { name, email, phone });

    /* ---------- VALIDATION ---------- */

    if (!name) {
      console.error("❌ Name missing");
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    if (!looksLikeEmail(email)) {
      console.error("❌ Invalid email");
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!looksLikePhone(phone)) {
      console.error("❌ Invalid phone");
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }

    console.log("✅ Validation passed");

    /* ---------- HUBSPOT ---------- */

    try {
      console.log("📤 Sending to HubSpot...");

      const fields = [
        { name: "firstname", value: name },
        { name: "email", value: email },
        { name: "phone", value: phone },
        { name: "product_id", value: productId },
        { name: "hubspot_owner_id", value: "42689674" },
        { name: "hs_lead_status", value: "New" },
        { name: "utm_source", value: utmSource },
        { name: "utm_medium", value: utmMedium },
        { name: "utm_campaign", value: utmCampaign },
        { name: "utm_term", value: utmTerm },
        { name: "utm_content", value: utmContent },
        { name: "page_url", value: "https://acca.iimskills.in/" },
        { name: "call_to_action", value: "ACCA Free Login" },
      ].filter(f => f.value && String(f.value).trim() !== "");

      const res = await fetch(
        "https://api.hsforms.com/submissions/v3/integration/submit/7042430/f87b3206-82bb-4596-adb3-10ce262727af",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields }),
        }
      );

      console.log("📨 HubSpot Status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ HubSpot Error:", text);
        return NextResponse.json(
          { error: "HubSpot submission failed" },
          { status: 500 }
        );
      }

      console.log("✅ HubSpot Success");

    } catch (e) {
      console.error("❌ HubSpot Exception:", e);
      return NextResponse.json(
        { error: "HubSpot error" },
        { status: 500 }
      );
    }

    /* ---------- RESPONSE ---------- */

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("🔥 API crash:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}