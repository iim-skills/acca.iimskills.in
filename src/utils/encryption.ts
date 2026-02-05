import crypto from "crypto";

export function encrypt(plainText: string, workingKey: string): string {
  const key = Buffer.from(workingKey, "utf8");
  const iv = Buffer.from(workingKey, "utf8");

  const cipher = crypto.createCipheriv(
    "aes-128-cbc",
    key.subarray(0, 16), // ✅ replace deprecated .slice()
    iv.subarray(0, 16)
  );

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  return encrypted;
}
