"use client";

import { useState } from "react";

export default function CCAvenuePage() {
  const [loading, setLoading] = useState(false);

  const handleCCAvenuePayment = async () => {
    setLoading(true);

    const res = await fetch("/api/ccavenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: "500",
        name: "Test User",
        email: "test@example.com",
        phone: "9999999999",
      }),
    });

    const data = await res.json();

    // Create form and submit
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://secure.ccavenue.com/transaction/initTrans";

    const encInput = document.createElement("input");
    encInput.type = "hidden";
    encInput.name = "encRequest";
    encInput.value = data.encryptedData;
    form.appendChild(encInput);

    const accInput = document.createElement("input");
    accInput.type = "hidden";
    accInput.name = "access_code";
    accInput.value = data.accessCode;
    form.appendChild(accInput);

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">CCAvenue Payment</h1>
      <button
        onClick={handleCCAvenuePayment}
        disabled={loading}
        className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        {loading ? "Redirecting..." : "Pay with CCAvenue"}
      </button>
    </div>
  );
}
