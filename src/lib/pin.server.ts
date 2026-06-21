// PIN hashing (PBKDF2 via Web Crypto — workerd compatible).
// Server-only.

const ITERATIONS = 100_000;
const KEY_LEN = 32;

function bufToB64(buf: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buf)).toString("base64");
}
function b64ToBuf(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, "base64"));
}

async function pbkdf2(pin: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    KEY_LEN * 8,
  );
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2(pin, salt);
  return `pbkdf2$${ITERATIONS}$${bufToB64(salt.buffer)}$${bufToB64(derived)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  try {
    const [, iterStr, saltB64, hashB64] = stored.split("$");
    const salt = b64ToBuf(saltB64);
    const expected = b64ToBuf(hashB64);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(pin),
      { name: "PBKDF2" },
      false,
      ["deriveBits"],
    );
    const derived = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: salt as BufferSource, iterations: Number(iterStr), hash: "SHA-256" },
        key,
        KEY_LEN * 8,
      ),
    );
    if (derived.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < derived.length; i++) diff |= derived[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}
