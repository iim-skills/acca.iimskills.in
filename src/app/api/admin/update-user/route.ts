import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { id, name, email, password } = await req.json();

    const filePath = path.join(process.cwd(), "data", "users", "users.json");
    const users = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Update the existing user
    const updatedUsers = users.map((user: any) => {
      if (user.id === id) {
        return { ...user, name, email, password };
      }
      return user;
    });

    // Save updated data
    fs.writeFileSync(filePath, JSON.stringify(updatedUsers, null, 2), "utf-8");

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
