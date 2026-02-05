import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.json();

  const { txnid, amount, productinfo, firstname, email } = body;

  const key = process.env.PAYU_MERCHANT_KEY!;
  const salt = process.env.PAYU_MERCHANT_SALT!;
  const payuUrl =
    process.env.PAYU_BASE_URL || "https://test.payu.in/_payment";

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;

  const hash = crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex");

  return NextResponse.json({
    key,
    hash,
    payuUrl,
  });
}
