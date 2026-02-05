// Run this with: node test.js
import nodemailer from 'nodemailer';

async function test() {
  console.log("1. Starting connection test...");

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Change to smtp.gmail.com if using Gmail
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'info@iimskills.com', // REPLACE THIS
      pass: 'xgeq inzu tven dulq'             // REPLACE THIS
    },
    // Force IPv4 and wait longer for connection
    family: 4, 
    connectionTimeout: 10000, 
    debug: true, 
    logger: true 
  });

  try {
    console.log("2. Verifying connection...");
    await transporter.verify();
    console.log("✅ SUCCESS! Your credentials and network are fine.");
  } catch (error) {
    console.error("❌ FAILED!");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    
    if (error.code === 'ESOCKET') {
        console.log("\n--- DIAGNOSIS ---");
        console.log("This is likely your ANTIVIRUS blocking Node.js.");
        console.log("Please disable 'Mail Shield' in Avast/AVG/McAfee and try again.");
    }
  }
}

test();