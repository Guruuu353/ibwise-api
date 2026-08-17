const { ApiError } = require("../../utils/apiResponse");

// Thin wrapper around Safaricom's Daraja API (STK Push / Lipa na M-Pesa
// Online). This talks to the REAL sandbox/production endpoint when
// MPESA_CONSUMER_KEY etc. are set in .env. Without those, it runs in
// "simulate" mode so the rest of the app (invoices, UI, webhook handling)
// is fully wired and testable before you have Daraja credentials —
// it does NOT pretend to move real money either way.
const isConfigured = () =>
  Boolean(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET && process.env.MPESA_SHORTCODE && process.env.MPESA_PASSKEY);

async function getAccessToken() {
  const base = process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
  const creds = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");

  const res = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  });
  if (!res.ok) throw new ApiError(502, "Could not reach M-Pesa (auth step).");
  const data = await res.json();
  return data.access_token;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Initiates an STK push (a payment prompt on the payer's phone).
// Returns { checkoutRequestId, simulated } — `simulated: true` means no
// real request was sent because Daraja credentials aren't configured.
async function initiateStkPush({ phone, amount, accountReference, callbackUrl }) {
  if (!isConfigured()) {
    return {
      simulated: true,
      checkoutRequestId: `SIMULATED-${Date.now()}`,
      message: "M-Pesa credentials are not configured — this is a simulated push, not a real one. Set MPESA_* env vars to go live.",
    };
  }

  const base = process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
  const ts = timestamp();
  const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${ts}`).toString("base64");
  const token = await getAccessToken();

  const res = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: "IBWISE school fees",
    }),
  });

  if (!res.ok) throw new ApiError(502, "M-Pesa declined the payment request.");
  const data = await res.json();
  return { simulated: false, checkoutRequestId: data.CheckoutRequestID };
}

module.exports = { initiateStkPush, isConfigured };
