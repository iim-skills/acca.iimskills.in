import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
});

export async function POST(req: Request) {

  try {

    const { email, password } = await req.json();

    console.log("📥 Login request:", { email });

    const [rows]: any = await pool.execute(
      `SELECT id,name,email,phone,password,courses FROM lms_students WHERE email=? LIMIT 1`,
      [email]
    );

    console.log("📦 DB Rows:", rows);

    if (!rows.length) {

      console.log("❌ User not found");

      return NextResponse.json({
        success: false,
        message: "User not found"
      });
    }

    const user = rows[0];

    console.log("👤 DB User:", user);

    if (user.password !== password) {

      console.log("❌ Invalid password");

      return NextResponse.json({
        success: false,
        message: "Invalid password"
      });
    }

    /* ==========================
       PARSE COURSES JSON
    ========================== */

    let courses: any[] = [];

    if (user.courses) {

      console.log("📚 Raw courses from DB:", user.courses);

      try {

        courses =
          typeof user.courses === "string"
            ? JSON.parse(user.courses)
            : user.courses;

      } catch (err) {

        console.log("❌ Courses JSON parse error:", err);

        courses = [];
      }

    }

    console.log("🎓 Parsed Courses:", courses);

    const studentType = courses.length > 0 ? "Paid" : "Free";

    const responseData = {
      success: true,
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentType,
        courses
      }
    };

    console.log("📤 API Response:", responseData);

    return NextResponse.json(responseData);

  } catch (error) {

    console.log("🚨 LOGIN ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error"
    });

  }

}