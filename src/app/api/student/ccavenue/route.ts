export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { encrypt } from "../../../../lib/ccavenue";

export async function POST(req: Request) {
  const body = await req.json();

  const merchant_id = process.env.CC_MERCHANT_ID!;
  const working_key = process.env.CC_WORKING_KEY!;
  const access_code = process.env.CC_ACCESS_CODE!;

  const payload = {
    merchant_id,
    order_id: body.orderId,
    currency: "INR",
    amount: body.amount,
    redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/ccavenue/response`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/ccavenue/response`,
    language: "EN",
    billing_name: body.name,
    billing_email: body.email,
    billing_tel: body.phone,
    billing_address: body.address,
    billing_city: body.cityState,
    billing_zip: body.pincode,
    billing_country: body.country,
  };

  const queryString = Object.entries(payload)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const encRequest = encrypt(queryString, working_key);

  return NextResponse.json({
    encRequest,
    access_code,
  });
}
