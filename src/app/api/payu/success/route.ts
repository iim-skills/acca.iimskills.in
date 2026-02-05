import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.formData();

  const status = data.get("status");
  const firstname = data.get("firstname");
  const amount = data.get("amount");
  const txnid = data.get("txnid");
  const email = data.get("email");
  const productinfo = data.get("productinfo");
  const receivedHash = data.get("hash");

  const salt = process.env.PAYU_MERCHANT_SALT!;
  const key = process.env.PAYU_MERCHANT_KEY!;

  const hashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

  const calculatedHash = crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex");

  if (calculatedHash === receivedHash) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success`
    );
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`
  );
}
