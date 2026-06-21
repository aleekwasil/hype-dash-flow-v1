// Paystack server client. Server-only.
// Reads PAYSTACK_SECRET_KEY (sk_test_... or sk_live_...).

const BASE = "https://api.paystack.co";

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function initTransaction(args: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; reference: string }> {
  if (!isPaystackConfigured()) throw new Error("Paystack not configured. Add PAYSTACK_SECRET_KEY.");
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: args.email,
      amount: args.amountKobo,
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: args.metadata ?? {},
    }),
  });
  const body: any = await res.json();
  if (!body?.status) throw new Error(body?.message || "Paystack init failed");
  return {
    authorization_url: body.data.authorization_url,
    reference: body.data.reference,
  };
}

export async function verifyTransaction(reference: string): Promise<{
  status: "success" | "failed" | "pending";
  amountKobo: number;
  raw: any;
}> {
  if (!isPaystackConfigured()) throw new Error("Paystack not configured.");
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
  });
  const body: any = await res.json();
  const s = body?.data?.status as string | undefined;
  return {
    status: s === "success" ? "success" : s === "abandoned" || s === "failed" ? "failed" : "pending",
    amountKobo: Number(body?.data?.amount ?? 0),
    raw: body,
  };
}

// Verify Paystack webhook signature (HMAC SHA-512 over raw body).
export async function verifyPaystackSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.PAYSTACK_SECRET_KEY),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // timing-safe compare
  if (hex.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
