import { NextResponse } from "next/server";
import CryptoJS from "crypto-js";

const merchantId = process.env.CCAVENUE_MERCHANT_ID as string;
const accessCode = process.env.CCAVENUE_ACCESS_CODE as string;
const workingKey = process.env.CCAVENUE_WORKING_KEY as string;

function encrypt(plainText: string, key: string) {
  const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
  const iv = CryptoJS.enc.Utf8.parse(key.substring(0, 16));
  const encrypted = CryptoJS.AES.encrypt(plainText, keyUtf8, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, amount, name, email, phone, address, city, pincode, country } = body;

    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/ccavenue-response`;

    const plainText = `merchant_id=${merchantId}&order_id=${orderId}&currency=INR&amount=${amount}&redirect_url=${redirectUrl}&cancel_url=${redirectUrl}&language=EN&billing_name=${name}&billing_email=${email}&billing_tel=${phone}&billing_address=${address}&billing_city=${city}&billing_zip=${pincode}&billing_country=${country}`;

    const encRequest = encrypt(plainText, workingKey);

    return NextResponse.json({
      encRequest,
      access_code: accessCode,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create CCAvenue order" }, { status: 500 });
  }
}
