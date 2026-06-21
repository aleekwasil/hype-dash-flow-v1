// VTpass HTTP client. Server-only.
// Reads VTPASS_API_KEY, VTPASS_SECRET_KEY, VTPASS_PUBLIC_KEY, VTPASS_BASE_URL.
// When credentials are missing, returns mock data so the UI flow still works in dev.

type VtpassVariation = { variation_code: string; name: string; variation_amount: string };

const FALLBACK_PLANS: Record<string, VtpassVariation[]> = {
  "mtn-data": [
    { variation_code: "mtn-100mb-daily", name: "100MB Daily", variation_amount: "100" },
    { variation_code: "mtn-1gb-monthly", name: "1GB Monthly", variation_amount: "500" },
    { variation_code: "mtn-3gb-monthly", name: "3GB Monthly", variation_amount: "1500" },
    { variation_code: "mtn-10gb-monthly", name: "10GB Monthly", variation_amount: "4500" },
  ],
  "glo-data": [
    { variation_code: "glo-1gb-daily", name: "1GB Daily", variation_amount: "350" },
    { variation_code: "glo-2.5gb-monthly", name: "2.5GB Monthly", variation_amount: "1000" },
    { variation_code: "glo-7.5gb-monthly", name: "7.5GB Monthly", variation_amount: "2500" },
  ],
  "airtel-data": [
    { variation_code: "airtel-500mb-daily", name: "500MB Daily", variation_amount: "300" },
    { variation_code: "airtel-1.5gb-monthly", name: "1.5GB Monthly", variation_amount: "1000" },
    { variation_code: "airtel-6gb-monthly", name: "6GB Monthly", variation_amount: "2500" },
  ],
  "etisalat-data": [
    { variation_code: "9mobile-500mb", name: "500MB Monthly", variation_amount: "500" },
    { variation_code: "9mobile-2gb", name: "2GB Monthly", variation_amount: "2000" },
    { variation_code: "9mobile-5.5gb", name: "5.5GB Monthly", variation_amount: "3000" },
  ],
};

function creds() {
  return {
    apiKey: process.env.VTPASS_API_KEY,
    secretKey: process.env.VTPASS_SECRET_KEY,
    publicKey: process.env.VTPASS_PUBLIC_KEY,
    baseUrl: process.env.VTPASS_BASE_URL || "https://sandbox.vtpass.com/api",
  };
}

export function isVtpassConfigured(): boolean {
  const c = creds();
  return Boolean(c.apiKey && c.secretKey);
}

export async function fetchDataPlans(serviceID: string): Promise<VtpassVariation[]> {
  const c = creds();
  if (!isVtpassConfigured()) return FALLBACK_PLANS[serviceID] ?? [];
  try {
    const url = `${c.baseUrl}/service-variations?serviceID=${encodeURIComponent(serviceID)}`;
    const res = await fetch(url, {
      headers: { "api-key": c.apiKey!, "public-key": c.publicKey ?? "" },
    });
    const data: any = await res.json();
    const variations: VtpassVariation[] = data?.content?.varations ?? data?.content?.variations ?? [];
    return variations.length ? variations : FALLBACK_PLANS[serviceID] ?? [];
  } catch (err) {
    console.error("[vtpass] fetchDataPlans failed", err);
    return FALLBACK_PLANS[serviceID] ?? [];
  }
}

export type VtpassPayInput = {
  serviceID: string;
  request_id: string;
  amount?: number;
  phone: string;
  variation_code?: string;
  billersCode?: string;
};

export type VtpassPayResult = {
  ok: boolean;
  providerRef?: string;
  status: "success" | "failed" | "pending";
  raw: any;
  httpStatus: number;
};

export async function vtpassPay(input: VtpassPayInput): Promise<VtpassPayResult> {
  const c = creds();
  if (!isVtpassConfigured()) {
    // Dev mock: simulate instant success
    return {
      ok: true,
      providerRef: `MOCK-${input.request_id}`,
      status: "success",
      raw: { mock: true, message: "VTpass not configured — mock success." },
      httpStatus: 200,
    };
  }
  try {
    const res = await fetch(`${c.baseUrl}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": c.apiKey!,
        "secret-key": c.secretKey!,
      },
      body: JSON.stringify(input),
    });
    const raw: any = await res.json();
    const code = String(raw?.code ?? "");
    const status: VtpassPayResult["status"] =
      code === "000" ? "success" : code === "099" ? "pending" : "failed";
    return {
      ok: status === "success",
      providerRef: raw?.content?.transactions?.transactionId ?? raw?.requestId,
      status,
      raw,
      httpStatus: res.status,
    };
  } catch (err: any) {
    console.error("[vtpass] pay failed", err);
    return { ok: false, status: "failed", raw: { error: err?.message }, httpStatus: 0 };
  }
}
