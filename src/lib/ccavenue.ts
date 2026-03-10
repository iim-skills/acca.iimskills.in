import crypto from "crypto";

const algorithm = "aes-128-cbc";

// CCAvenue FIXED IV (DO NOT CHANGE)
const iv = Buffer.from([
  0x00, 0x01, 0x02, 0x03,
  0x04, 0x05, 0x06, 0x07,
  0x08, 0x09, 0x0a, 0x0b,
  0x0c, 0x0d, 0x0e, 0x0f,
]);

export function encrypt(text: string, workingKey: string) {
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(workingKey),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function decrypt(text: string, workingKey: string) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(workingKey),
    iv
  );
  let decrypted = decipher.update(text, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
