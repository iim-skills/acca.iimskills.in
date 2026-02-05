import crypto from "crypto";

export function generatePassword(length = 10) {
  return crypto.randomBytes(Math.ceil(length * 0.75)).toString("base64").slice(0, length);
}

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}
