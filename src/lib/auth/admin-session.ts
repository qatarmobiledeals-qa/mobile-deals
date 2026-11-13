import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "md_admin_session";

export interface AdminSessionPayload {
  email: string;
  id: string;
  role: "admin";
  loggedAt: string;
}

/**
 * Returns the server-only cryptographic secret for signing admin session cookies.
 */
export function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[AUTH] Warning: Neither ADMIN_SESSION_SECRET nor SUPABASE_SERVICE_ROLE_KEY is set. Using fallback signing key.");
    }
    return "mobile-deals-qatar-admin-secret-key-fallback";
  }
  return secret;
}

/**
 * Signs the admin payload using HMAC-SHA256 to prevent cookie tampering and forgery.
 */
export function signAdminPayload(payload: Record<string, unknown>): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = getSessionSecret();
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Cryptographically verifies an admin session token using constant-time comparison.
 */
export function verifyAdminToken(token: string): AdminSessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  if (!data || !signature) return null;

  try {
    const secret = getSessionSecret();
    const expectedSig = crypto.createHmac("sha256", secret).update(data).digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const jsonStr = Buffer.from(data, "base64url").toString("utf8");
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object" || parsed.role !== "admin" || !parsed.email) {
      return null;
    }
    return parsed as AdminSessionPayload;
  } catch {
    return null;
  }
}

