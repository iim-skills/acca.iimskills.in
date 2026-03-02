import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

type Order = {
  id: string;
  amount: number;
  email?: string;
  name?: string;
  phone?: string;
  course?: string;
  notes?: Record<string, any>;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  status: "success" | "failed" | "pending";
  created_at: string;
  raw_payload: any;
};

const DATA_FILE = path.join(process.cwd(), "razorpay-orders.json");

// Read existing orders
function readOrders(): Order[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data) as Order[];
  } catch (err) {
    console.error("Error reading JSON file:", err);
    return [];
  }
}

// Save orders to file
function writeOrders(orders: Order[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error("Error writing JSON file:", err);
  }
}

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
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  // Verify webhook signature
  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

  if (signature !== expectedSignature) {
    console.warn("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const event = payload.event;

  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;

  if (!paymentEntity && !orderEntity) {
    return NextResponse.json({ error: "No payment/order data" }, { status: 400 });
  }

  const orderId = paymentEntity?.order_id || orderEntity?.id || "unknown";

  // Determine status
  let status: Order["status"] = "pending";
  if (paymentEntity) {
    if (paymentEntity.status === "captured") status = "success";
    else if (paymentEntity.status === "failed") status = "failed";
  } else if (orderEntity) {
    if (event === "order.paid" || orderEntity.status === "paid") status = "success";
  }

  // Helper to extract name from many possible places
  function extractName() {
    return (
      paymentEntity?.notes?.name ||
      paymentEntity?.notes?.full_name ||
      paymentEntity?.notes?.customer_name ||
      orderEntity?.notes?.name ||
      orderEntity?.notes?.full_name ||
      orderEntity?.notes?.customer_name ||
      paymentEntity?.email?.split?.("@")?.[0] ||
      undefined
    );
  }

  const name = extractName();
  const email = paymentEntity?.email || orderEntity?.email || paymentEntity?.notes?.email || orderEntity?.notes?.email;
  const phone = paymentEntity?.contact || paymentEntity?.notes?.phone || orderEntity?.notes?.phone || orderEntity?.contact;
  const course = paymentEntity?.notes?.course || orderEntity?.notes?.course || paymentEntity?.notes?.program || orderEntity?.notes?.program;

  const addressFromNotes = paymentEntity?.notes?.address || orderEntity?.notes?.address;

  const order: Order = {
    id: orderId,
    amount: paymentEntity?.amount || orderEntity?.amount || 0,
    email,
    name,
    phone,
    course,
    notes: paymentEntity?.notes || orderEntity?.notes || {},
    address: addressFromNotes
      ? {
          line1: addressFromNotes.line1,
          line2: addressFromNotes.line2,
          city: addressFromNotes.city,
          state: addressFromNotes.state,
          postal_code: addressFromNotes.postal_code,
          country: addressFromNotes.country,
        }
      : undefined,
    status,
    created_at: new Date().toISOString(),
    raw_payload: payload,
  };

  // Save to JSON (preserve existing orders)
  try {
    const orders = readOrders();
    const filtered = orders.filter((o) => o.id !== order.id);
    filtered.unshift(order);
    writeOrders(filtered);
  } catch (err) {
    console.error("Failed to update JSON file:", err);
  }

  // Update DB (insert or update)
  if (process.env.DB_HOST && process.env.DB_NAME) {
    try {
      const conn = await getConnection();
      await ensurePaymentOrdersTable(conn);

      await conn.execute(
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
          order.id,
          order.amount,
          order.name || null,
          order.email || null,
          order.phone || null,
          order.course || null,
          order.notes?.program || null,
          order.status,
          JSON.stringify(order.raw_payload),
          paymentEntity?.id || null,
          JSON.stringify(paymentEntity?.notes?.billing_address || orderEntity?.notes?.billing_address || null),
          JSON.stringify(paymentEntity?.notes?.shipping_address || orderEntity?.notes?.shipping_address || null),

        ]
      );

      await conn.end();
    } catch (dbErr) {
      console.error("Failed to update DB from webhook:", dbErr);
    }
  } else {
    console.warn("DB env not set; skipping DB update from webhook.");
  }

  console.log(`Webhook processed for order ${order.id}, status: ${order.status}`);
  return NextResponse.json({ ok: true });
}

// GET API (optional: returns JSON file contents)
export async function GET() {
  const orders = readOrders();
  return NextResponse.json({ orders });
}


