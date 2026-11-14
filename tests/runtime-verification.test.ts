import test from "node:test";
import assert from "node:assert/strict";
import { signAdminPayload, verifyAdminToken, ADMIN_COOKIE_NAME } from "../src/lib/auth/admin-session.ts";
import { routing } from "../src/i18n/routing.ts";
import { formatPrice, formatCurrency, formatNumber, formatDate } from "../src/lib/formatters.ts";

test("Proxy & Auth: signs and validates legitimate admin token", () => {
  const token = signAdminPayload({
    email: "admin@mobiledealsqa.com",
    id: "admin-123",
    role: "admin",
    loggedAt: new Date().toISOString(),
  });

  const verified = verifyAdminToken(token);
  assert.ok(verified, "Token should verify successfully");
  assert.equal(verified?.email, "admin@mobiledealsqa.com");
  assert.equal(verified?.role, "admin");
});

test("Proxy & Auth: rejects forged or modified admin tokens", () => {
  const token = signAdminPayload({
    email: "admin@mobiledealsqa.com",
    id: "admin-123",
    role: "admin",
    loggedAt: new Date().toISOString(),
  });

  const [data, sig] = token.split(".");
  // Tamper with data payload
  const tamperedData = Buffer.from(JSON.stringify({
    email: "attacker@mobiledealsqa.com",
    id: "admin-123",
    role: "admin",
  })).toString("base64url");

  const tamperedToken = `${tamperedData}.${sig}`;
  assert.equal(verifyAdminToken(tamperedToken), null, "Tampered payload must be rejected");

  // Completely bogus token
  assert.equal(verifyAdminToken("invalid.token.structure"), null);
  assert.equal(verifyAdminToken(""), null);
  assert.equal(verifyAdminToken("nonjson.badsig"), null);
});

test("Routing: supports locales en and ar with default en", () => {
  assert.deepEqual(routing.locales, ["en", "ar"]);
  assert.equal(routing.defaultLocale, "en");
  assert.equal(routing.localePrefix, "always");
});

test("Formatters: formats currency and numbers accurately for Qatar", () => {
  // English format
  const enPrice = formatPrice(2499, "en");
  assert.ok(enPrice.includes("2,499"), `Expected English price formatting, got: ${enPrice}`);
  assert.ok(enPrice.includes("QAR") || enPrice.includes("QR"), `Expected QAR in ${enPrice}`);

  // Arabic format
  const arPrice = formatPrice(2499, "ar");
  assert.ok(arPrice.includes("ر.ق") || arPrice.includes("QAR"), `Expected Arabic currency symbol in ${arPrice}`);

  // Number formatting
  const enNum = formatNumber(1250, "en");
  assert.equal(enNum, "1,250");
});

