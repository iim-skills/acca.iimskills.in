import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req:Request){

  const email = req.headers.get("x-user-email");

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if(!email){
    return NextResponse.json({error:"Unauthorized"},{status:401});
  }

  const [rows]:any = await db.query(
    `SELECT name,email,courses FROM lms_students WHERE email=?`,
    [email]
  );

  if(!rows.length){
    return NextResponse.json({error:"Student not found"});
  }

  const student = rows[0];

  let courses = [];

  try{
    courses = JSON.parse(student.courses || "[]");
  }catch{
    courses = [];
  }

  const course = courses.find((c:any)=>c.course_slug === slug);

  return NextResponse.json({
    name:student.name,
    email:student.email,
    modules:course?.modules || [],
    progress:course?.progress || {}
  });

}