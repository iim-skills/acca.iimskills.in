import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getPostsByAuthor } from "../../../../lib/posts";

interface UserType {
  id: number;
  username?: string;
  name: string;
  email?: string;
  authordesig?: string;
  widgetID?: string;
  role?: string;
  photo?: string;
  bio?: any;
  education?: string[];
  expertIn?: string[];
  socials?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ username: string }> } // 👈 params as Promise
) {
  try {
    const { username } = await context.params; // 👈 await params
    const decodedUsername = decodeURIComponent(username).trim().toLowerCase();

    const usersFile = path.join(process.cwd(), "data/users/users.json");
    if (!fs.existsSync(usersFile)) {
      return NextResponse.json({ error: "Users file not found" }, { status: 500 });
    }

    const users: UserType[] = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
    const user = users.find(
      (u) => u.username?.trim().toLowerCase() === decodedUsername
    );

    if (!user) {
      console.warn(`⚠️ User not found for username: "${decodedUsername}"`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const authorName = user.name || "";
    console.log("✅ Author Name from API:", authorName);

    const latestPosts = getPostsByAuthor(authorName, 6);

    return NextResponse.json({
      ...user,
      authordesig: user.authordesig || "Author",
      latestPosts,
    });
  } catch (err) {
    console.error("❌ Error in /api/user/[username]:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
