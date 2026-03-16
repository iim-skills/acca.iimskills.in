import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ---------- MODULE NAME MAP ---------- */

const moduleMap: Record<string,string> = {
  MOD_1: "Corporate & Business Law (Global)",
  MOD_2: "Performance Management",
  MOD_3: "Taxation",
  MOD_4: "Financial Reporting",
  MOD_5: "Audit & Assurance",
  MOD_6: "Financial Management",
};

/* ================= GET STUDENTS ================= */

export async function GET() {

  try {

    const [rows]: any = await pool.query(`
      SELECT id,name,email,phone,courses,status,enrolled_at
      FROM lms_students
      ORDER BY id DESC
    `);

    console.log("STUDENTS FOUND:", rows.length);

    const students = rows.map((r:any)=>{

      let courses:any[] = [];

      try{
        courses = typeof r.courses === "string"
          ? JSON.parse(r.courses)
          : r.courses || [];
      }
      catch(err){
        console.error("COURSE PARSE ERROR:", err);
      }

      courses.forEach((course:any)=>{

        if(Array.isArray(course.modules)){

          course.modules = course.modules.map((m:string)=>{

            const name = moduleMap[m] || m;

            console.log(`MODULE MAP: ${m} → ${name}`);

            return name;

          });

        }

      });

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        courses,
        status: r.status || "active",
        enrolledAt: r.enrolled_at,
      };

    });

    return NextResponse.json(students);

  }
  catch(error){

    console.error("LMS STUDENTS API ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load students" },
      { status: 500 }
    );

  }

}