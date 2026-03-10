// lib/getUserData.ts
import path from "path";
import fs from "fs/promises";
import mysql from "mysql2/promise";

export type Post = {
  id?: number;
  title: string;
  date?: string;
  author?: string;
  slug: string;
  [k: string]: any;
};

export type BioSection = { type?: string; items?: string[]; content?: string };
export type BioObject = {
  paragraphs?: string[];
  books?: string[];
  sections?: BioSection[];
  closing?: string | string[];
};

export type User = {
  id?: number;
  username?: string;
  name: string;
  email?: string;
  authordesig?: string;
  widgetID?: string; // <- widgetID comes from local users.json (fallback)
  role?: string;
  photo?: string;
  bio?: string | BioObject;
  education?: any;
  expertIn?: any;
  socials?: any;
  latestPosts?: Post[];
};

// POSTS DIRECTORY
const POSTS_DIR = path.join(process.cwd(), "data/posts");

// -------------------------------------------------------------
// MYSQL connection (reads credentials from .env)
// -------------------------------------------------------------
async function getDbConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    port: Number(process.env.DB_PORT) || 3306,
  });
}

// -------------------------------------------------------------
// CACHE for DB Query
// -------------------------------------------------------------
let USERS_CACHE: {
  ts: number;
  ttl: number;
  data?: User[];
  inflight?: Promise<User[]>;
} = {
  ts: 0,
  ttl: 60_000,
};

// -------------------------------------------------------------
// Slugify helper
// -------------------------------------------------------------
const slugify = (str: string) =>
  (str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

// -------------------------------------------------------------
// Load users from MySQL (cached)
// -------------------------------------------------------------
async function loadUsersCached(ttl = USERS_CACHE.ttl): Promise<User[]> {
  const now = Date.now();

  if (USERS_CACHE.data && now - USERS_CACHE.ts < ttl) {
    return USERS_CACHE.data;
  }

  if (USERS_CACHE.inflight) {
    return USERS_CACHE.inflight;
  }

  USERS_CACHE.inflight = (async () => {
    try {
      const conn = await getDbConnection();
      const [rows] = await conn.query("SELECT * FROM users ORDER BY id DESC");
      // cast rows to User[] safely
      USERS_CACHE.data = (rows as any[]).map((r) => ({
        id: r.id,
        username: r.username,
        name: r.name,
        email: r.email,
        authordesig: r.authordesig,
        photo: r.photo,
        bio: r.bio,
        education: r.education,
        expertIn: r.expertIn,
        socials: r.socials,
        // note: we DO NOT trust widgetID from DB — we'll prefer local users.json
      })) as User[];
      await conn.end();
    } catch (err) {
      console.error("❌ MySQL Error loading users:", err);
      USERS_CACHE.data = [];
    } finally {
      USERS_CACHE.ts = Date.now();
      USERS_CACHE.inflight = undefined;
    }

    return USERS_CACHE.data!;
  })();

  return USERS_CACHE.inflight;
}

// -------------------------------------------------------------
// Local users.json fallback loader (for widgetID & iframe widget)
// -------------------------------------------------------------
async function loadLocalUsersJson(): Promise<any[]> {
  try {
    const usersPath = path.join(process.cwd(), "data/users/users.json");
    const txt = await fs.readFile(usersPath, "utf8");
    const parsed = JSON.parse(txt);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return Object.values(parsed);
    return [];
  } catch (e) {
    // no local file — that's fine
    return [];
  }
}

// -------------------------------------------------------------
// Load latest posts by author
// -------------------------------------------------------------
async function loadLatestPostsByAuthor(author: string, latestCount: number): Promise<Post[]> {
  try {
    const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith(".json"));

    const stats = await Promise.all(
      files.map(async (f) => ({
        file: f,
        stat: await fs.stat(path.join(POSTS_DIR, f)),
      }))
    );

    stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

    const latest: Post[] = [];
    for (const { file } of stats) {
      if (latest.length >= latestCount) break;

      try {
        const txt = await fs.readFile(path.join(POSTS_DIR, file), "utf-8");
        const post = JSON.parse(txt) as Post;

        if (post.author && slugify(post.author) === slugify(author)) {
          latest.push(post);
        }
      } catch {
        continue;
      }
    }

    return latest;
  } catch (e) {
    console.warn("⚠️ Could not read posts directory:", e);
    return [];
  }
}

// -------------------------------------------------------------
// NORMALIZERS — Prevent .map errors
// -------------------------------------------------------------
function normalizeArray(value: any): any[] {
  try {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    if (typeof value === "object" && value !== null) return [value];
  } catch {}
  return [];
}

function normalizeBio(value: any): BioObject | undefined {
  try {
    if (!value) return undefined;
    if (typeof value === "object") return value;
    if (typeof value === "string" && value.trim()) {
      return JSON.parse(value);
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function normalizeSocials(value: any) {
  try {
    if (!value) return {};
    if (typeof value === "object") return value;
    if (typeof value === "string" && value.trim()) return JSON.parse(value);
  } catch {}
  return {};
}

// -------------------------------------------------------------
// PUBLIC FUNCTION — returns fully normalized user + posts
// -------------------------------------------------------------
export async function getUserData(
  usernameParam: string,
  latestCount = 5
): Promise<User | null> {
  const allUsers = await loadUsersCached();
  if (!allUsers.length) return null;

  const usernameSlug = slugify(usernameParam);

  const user = allUsers.find((u) => {
    const nameSlug = slugify(u.name || "");
    const unameSlug = slugify(u.username || "");
    return nameSlug === usernameSlug || unameSlug === usernameSlug;
  });

  if (!user) return null;

  // Merge widgetID from local users.json (if any) — user requested widgetID should still be picked from code/local file
  try {
    const localUsers = await loadLocalUsersJson(); // array of objects
    if (Array.isArray(localUsers) && localUsers.length > 0) {
      const matchedLocal = localUsers.find((lu: any) => {
        const luName = slugify(lu.name || lu.fullname || "");
        const luUser = slugify(lu.username || "");
        return luName === slugify(user.name || "") || luUser === slugify(user.username || "");
      });
      if (matchedLocal && matchedLocal.widgetID) {
        // ensure widgetID is string
        user.widgetID = String(matchedLocal.widgetID).trim();
      }
    }
  } catch (e) {
    // ignore — widgetID fallback is optional
  }

  // Normalize fields
  const education = normalizeArray((user as any).education);
  const expertIn = normalizeArray((user as any).expertIn || (user as any).expertise);
  const socials = normalizeSocials((user as any).socials);
  const bio = normalizeBio(user.bio);

  const photo = user.photo || "/user.jpg";

  const latestPosts = await loadLatestPostsByAuthor(user.name, latestCount);

  return {
    ...user,
    authordesig: user.authordesig || "Author",
    photo,
    education,
    expertIn,
    socials,
    bio,
    latestPosts,
  };
}
