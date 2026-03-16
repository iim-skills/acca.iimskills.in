import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {

  try {

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    console.log("Free Login:", cleanEmail);

    /* ===============================
       CHECK STUDENT
    =============================== */

    const [rows]: any = await db.query(
      `SELECT * FROM lms_students WHERE email=? LIMIT 1`,
      [cleanEmail]
    );

    let student;

    /* ===============================
       CREATE NEW FREE STUDENT
    =============================== */

    if (!rows.length) {

      const name = cleanEmail.split("@")[0];

      const [insertRes]: any = await db.query(
        `
        INSERT INTO lms_students
        (
          name,
          email,
          login_id,
          password,
          courses,
          student_type
        )
        VALUES (?,?,?,?,?,?)
        `,
        [
          name,
          cleanEmail,
          cleanEmail,
          cleanEmail,
          JSON.stringify([]), // no courses assigned
          "free"
        ]
      );

      const [newUser]: any = await db.query(
        `SELECT * FROM lms_students WHERE id=?`,
        [insertRes.insertId]
      );

      student = newUser[0];

      console.log("New Free Student:", student.email);
    }

    /* ===============================
       EXISTING USER LOGIN
    =============================== */

    else {

      student = rows[0];

      await db.query(
        `UPDATE lms_students SET password=? WHERE id=?`,
        [cleanEmail, student.id]
      );

      console.log("Existing Free Login:", student.email);
    }

    /* ===============================
       RESPONSE
    =============================== */

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      courses: [],
      role: "student",
      studentType: "free"
    });

  } catch (err) {

    console.error("Free login error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );

  }

}