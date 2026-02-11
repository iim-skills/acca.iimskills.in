// File: app/api/enroll/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // TODO: Save to database (MongoDB, MySQL, etc.)
    console.log("Received enrollment data:", body);

    // Example: you can send an email or store in database
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in enroll API:", error);
    return new NextResponse("Failed to save enrollment", { status: 500 });
  }
}
