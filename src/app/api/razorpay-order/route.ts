import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import mysql from "mysql2/promise";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
  });
}

async function ensurePaymentOrdersTable(conn: mysql.Connection) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS payment_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      razorpay_order_id VARCHAR(255) UNIQUE,
      amount INT,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      course VARCHAR(255),
      program VARCHAR(255),
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      raw_payload JSON,
      razorpay_payment_id VARCHAR(255),
      billing_address TEXT,
      shipping_address TEXT
    )
  `);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("BODY:", body);

    const {
      amount,
      name,
      email,
      phone,
      course = "",
      program = "",
      billing = "",
      shipping = "",
    } = body;

    const amountNumber = Number(amount);

    // ✅ FIXED VALIDATION
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Missing user details" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amountNumber)) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // ✅ FREE COURSE FIX
    if (amountNumber <= 0) {
      return NextResponse.json(
        { error: "Free course - no payment needed" },
        { status: 400 }
      );
    }

    // ✅ CREATE ORDER
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amountNumber),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        name,
        email,
        phone,
        course,
        program,
        billing_address: billing,
      },
    });

    // ✅ SAVE IN DB
    try {
      const connection = await getConnection();
      await ensurePaymentOrdersTable(connection);

      await connection.execute(
        `INSERT INTO payment_orders 
        (razorpay_order_id, amount, name, email, phone, course, program, status, raw_payload, billing_address, shipping_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          razorpayOrder.id,
          amountNumber,
          name,
          email,
          phone,
          course,
          program,
          "pending",
          JSON.stringify(razorpayOrder),
          billing,
          shipping,
        ]
      );

      await connection.end();
    } catch (dbError) {
      console.error("DB Error:", dbError);
    }

    return NextResponse.json(razorpayOrder);
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}