import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Account, User } from "next-auth";
import fs from "fs";
import path from "path";

// ---------- FILE PATHS ----------
const USERS_FILE = path.join(process.cwd(), "data", "users", "users.json");
const OTP_FILE = path.join(process.cwd(), "data", "otp.json");

// ---------- HELPERS ----------
function ensureFile(filePath: string, defaultData: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

function readJson(filePath: string, fallback: any) {
  try {
    ensureFile(filePath, fallback);
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: any) {
  ensureFile(filePath, {});
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------- NEXTAUTH ----------
export const authOptions: NextAuthOptions = {
  providers: [
    // 🔵 GOOGLE LOGIN
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 🔵 EMAIL + PASSWORD + OTP
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },

      async authorize(credentials) {
        if (!credentials) return null;

        const email = credentials.email?.trim();
        const password = credentials.password;
        const otp = credentials.otp;

        if (!email || !password) return null;

        // Load users
        const users = readJson(USERS_FILE, []);
        const user = users.find(
          (u: any) => u.email === email && u.password === password
        );

        if (!user) return null;

        // Load OTP store
        const otpStore = readJson(OTP_FILE, {});
        const now = Date.now();

        // 🟡 STEP 1 → SEND OTP
        if (!otp) {
          const generatedOtp = Math.floor(
            100000 + Math.random() * 900000
          ).toString();

          otpStore[email] = {
            otp: generatedOtp,
            expires: now + 5 * 60 * 1000,
          };

          writeJson(OTP_FILE, otpStore);

          console.log("LOGIN OTP:", generatedOtp); // 🔴 replace with email/SMS

          // IMPORTANT: return temp user instead of throwing error
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            otpRequired: true, // frontend check
          } as any;
        }

        // 🟢 STEP 2 → VERIFY OTP
        const entry = otpStore[email];

        if (!entry) return null;
        if (now > entry.expires) return null;
        if (entry.otp !== otp) return null;

        // OTP verified → cleanup
        delete otpStore[email];
        writeJson(OTP_FILE, otpStore);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      // Google user save
      if (account?.provider === "google") {
        try {
          const baseUrl =
            process.env.NEXTAUTH_URL ||
            process.env.NEXT_PUBLIC_BASE_URL ||
            "http://localhost:3000";

          const res = await fetch(`${baseUrl}/api/save-google-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              image: user.image,
            }),
          });

          if (!res.ok) {
            console.error("Google user save failed");
          }
        } catch (err) {
          console.error("Google save error:", err);
        }
      }

      return true;
    },

    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.otpRequired = user.otpRequired || false;
      }
      return token;
    },

    async session({ session, token }: any) {
      if (token) {
        session.user.role = token.role;
        session.user.otpRequired = token.otpRequired;
      }
      return session;
    },
  },

};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
