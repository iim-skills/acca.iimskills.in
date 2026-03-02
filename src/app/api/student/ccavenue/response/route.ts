export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { decrypt } from "../../../../../lib/ccavenue";

export async function POST(req: Request) {
  const formData = await req.formData();
  const encResp = formData.get("encResp") as string;

  const decrypted = decrypt(
    encResp,
    process.env.CC_WORKING_KEY!
  );

  console.log("PAYMENT RESPONSE:", decrypted);

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_BASE_URL}/success`
  );
}
