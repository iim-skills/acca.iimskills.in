// import { NextRequest, NextResponse } from 'next/server';
// import Razorpay from 'razorpay';
// import mysql from 'mysql2/promise';

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_yourkey',
//   key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret',
// });

// // ✅ DB connection helper
// async function getConnection() {
//   return mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: Number(process.env.DB_PORT) || 3306,
//   });
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { amount, name, email, phone } = body;

//     if (!amount || !name || !email || !phone) {
//       return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
//     }

//     // ✅ Create Razorpay order
//     let razorpayOrder;
//     try {
//       razorpayOrder = await razorpay.orders.create({
//         amount,
//         currency: 'INR',
//         receipt: `receipt_${Date.now()}`,
//         notes: {
//           email,               // 👈 optional, still good to have
//           phone,               // 👈 for quick lookup
//           course: body.course, // 👈 which course was purchased
//           billing_address: body.billing || "",
//           shipping_address: body.shipping || "",
//           name,                // 👈 student’s name
//   },
//       });
//     } catch (err) {
//       console.error('Razorpay Order Error:', err);
//       return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
//     }

//     // ✅ Save order with "pending" status
//     try {
//       const connection = await getConnection();

//       await connection.execute(`
//         CREATE TABLE IF NOT EXISTS payment_orders (
//           id INT AUTO_INCREMENT PRIMARY KEY,
//           razorpay_order_id VARCHAR(255),
//           amount INT,
//           name VARCHAR(255),
//           email VARCHAR(255),
//           phone VARCHAR(20),
//           status VARCHAR(50),
//           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         )
//       `);

//       await connection.execute(
//         `INSERT INTO payment_orders (razorpay_order_id, amount, name, email, phone, status)
//          VALUES (?, ?, ?, ?, ?, ?)`,
//         [razorpayOrder.id, amount, name, email, phone, 'pending']
//       );

//       await connection.end();
//     } catch (dbError) {
//       console.error('Database Error:', dbError);
//     }

//     return NextResponse.json(razorpayOrder);
//   } catch (err: any) {
//     console.error('Unexpected Error:', err);
//     return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import mysql from "mysql2/promise";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_yourkey",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "your_secret",
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

// ensure table exists and add missing columns if needed
async function ensurePaymentOrdersTable(conn: mysql.Connection) {
  // create base table if not exists (with unique constraint on razorpay_order_id)
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

  // Add any missing columns (some hosts/MySQL versions may already have them)
  // We'll check information_schema and add columns that are missing
  const neededCols: Record<string, string> = {
    raw_payload: "JSON",
    razorpay_payment_id: "VARCHAR(255)",
    billing_address: "TEXT",
    shipping_address: "TEXT",
    course: "VARCHAR(255)",
    program: "VARCHAR(255)",
  };

  for (const col in neededCols) {
    const [rows]: any = await conn.execute(
      `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [process.env.DB_NAME, "payment_orders", col]
    );
    const cnt = rows[0]?.cnt || rows[0]?.COUNT || (rows[0] && Object.values(rows[0])[0]) || 0;
    if (Number(cnt) === 0) {
      await conn.execute(`ALTER TABLE payment_orders ADD COLUMN ${col} ${neededCols[col]}`);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, name, email, phone } = body;

    if (!amount || !name || !email || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Create Razorpay order with notes (including name, course, program, billing)
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          name,
          email,
          phone,
          course: body.course || "",
          program: body.program || "",
          billing_address: body.billing || "",
          pincode: body.pincode || "",
          city_state: body.cityState || "",
          country: body.country || "",
        },
      });
    } catch (err) {
      console.error("Razorpay Order Error:", err);
      return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
    }

    // Save order to DB (create table / add columns if necessary)
    try {
      const connection = await getConnection();
      await ensurePaymentOrdersTable(connection);

      // Insert or update (if already exists)
      await connection.execute(
        `INSERT INTO payment_orders 
        (razorpay_order_id, amount, name, email, phone, course, program, status, raw_payload, razorpay_payment_id, billing_address, shipping_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          amount=VALUES(amount),
          name=VALUES(name),
          email=VALUES(email),
          phone=VALUES(phone),
          course=VALUES(course),
          program=VALUES(program),
          status=VALUES(status),
          raw_payload=VALUES(raw_payload),
          razorpay_payment_id=VALUES(razorpay_payment_id),
          billing_address=VALUES(billing_address),
          shipping_address=VALUES(shipping_address)
        `,
        [
          razorpayOrder.id,
          amount,
          name,
          email,
          phone,
          body.course || "",
          body.program || "",
          "pending",
          JSON.stringify(razorpayOrder),
          null,
          body.billing || "",
          body.shipping || "",
        ]
      );

      await connection.end();
    } catch (dbError) {
      console.error("Database Error (order save):", dbError);
      // not fatal for checkout — continue returning order
    }

    return NextResponse.json(razorpayOrder);
  } catch (err: any) {
    console.error("Unexpected Error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

