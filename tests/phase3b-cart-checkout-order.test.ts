import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import type * as WhatsappMod from "../src/lib/whatsapp.ts";
import type { CartItem } from "../src/types/database.ts";

const require = createRequire(import.meta.url);
const Module = require("node:module");
const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");

function loadTsModule<T>(relPath: string): T {
  const absPath = path.join(PROJECT_ROOT, relPath);
  const originalLoad = Module._load;
  Module._load = function patchedLoad(
    request: string,
    parent: { filename?: string } | null,
    isMain: boolean
  ) {
    if (request.startsWith("./") || request.startsWith("../")) {
      const base = path.resolve(path.dirname(parent?.filename || absPath), request);
      for (const ext of ["", ".ts", ".tsx"]) {
        if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) {
          return loadTsModule(path.relative(PROJECT_ROOT, base + ext));
        }
      }
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    const source = fs.readFileSync(absPath, "utf8");
    const transpiled = ts.transpileModule(source, {
      fileName: absPath,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    });
    const mod = new Module(absPath);
    mod.filename = absPath;
    mod.paths = Module._nodeModulePaths(path.dirname(absPath));
    mod._compile(transpiled.outputText, absPath);
    return mod.exports as T;
  } finally {
    Module._load = originalLoad;
  }
}

const {
  formatWhatsAppNumber,
  generateCartWhatsAppUrl,
  generateProductWhatsAppUrl,
} = loadTsModule<typeof WhatsappMod>("src/lib/whatsapp.ts");
const enMessages = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, "src/messages/en.json"), "utf8")
) as Record<string, Record<string, unknown>>;
const arMessages = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, "src/messages/ar.json"), "utf8")
) as Record<string, Record<string, unknown>>;

function lookupMessage(messages: Record<string, unknown>, keyPath: string): string | null {
  const parts = keyPath.split(".");
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return typeof cur === "string" ? cur : null;
}

describe("Phase 3B: WhatsApp Localization & Encoding", () => {
  it("formatWhatsAppNumber normalizes 8-digit Qatar numbers and strips formatting", () => {
    assert.equal(formatWhatsAppNumber("55000000"), "97455000000");
    assert.equal(formatWhatsAppNumber("+974 5500-0000"), "97455000000");
  });

  it("generateProductWhatsAppUrl generates properly encoded EN and AR messages", () => {
    const enUrl = generateProductWhatsAppUrl({
      storeNumber: "+97455000000",
      productName: "iPhone 16 Pro",
      variantName: "256GB Titanium",
      price: 4299,
      quantity: 2,
      currency: "QAR",
      locale: "en",
    });
    assert.ok(enUrl.startsWith("https://wa.me/97455000000?text="));
    const enDecoded = decodeURIComponent(enUrl.split("?text=")[1]);
    assert.match(enDecoded, /Hello Mobile Deals/);
    assert.match(enDecoded, /Product: \*iPhone 16 Pro\*/);
    assert.match(enDecoded, /Variant: 256GB Titanium/);
    assert.match(enDecoded, /Price: QAR 4,299/);
    assert.match(enDecoded, /Quantity: 2/);

    const arUrl = generateProductWhatsAppUrl({
      storeNumber: "+97455000000",
      productName: "آيفون 16 برو",
      variantName: "256 جيجابايت تيتانيوم",
      price: 4299,
      quantity: 2,
      currency: "QAR",
      locale: "ar",
    });
    assert.ok(arUrl.startsWith("https://wa.me/97455000000?text="));
    const arDecoded = decodeURIComponent(arUrl.split("?text=")[1]);
    assert.match(arDecoded, /مرحباً موبايل ديلز/);
    assert.match(arDecoded, /المنتج: \*آيفون 16 برو\*/);
    assert.match(arDecoded, /الخيار: 256 جيجابايت تيتانيوم/);
    assert.match(arDecoded, /4,299 ر\.ق/);
    assert.match(arDecoded, /الكمية: 2/);
  });

  it("generateCartWhatsAppUrl resolves bilingual CartItem names and generates EN/AR totals", () => {
    const items: CartItem[] = [
      {
        productId: "p1",
        productName: "Samsung Galaxy S25",
        productNameAr: "سامسونج جالاكسي إس 25",
        productSlug: "galaxy-s25",
        variantId: "v1",
        variantName: "256GB Black",
        variantNameAr: "256 جيجابايت أسود",
        price: 3500,
        quantity: 2,
        imageUrl: "/img.jpg",
      },
    ];

    const enUrl = generateCartWhatsAppUrl({ items, total: 7000, locale: "en" });
    const enDecoded = decodeURIComponent(enUrl.split("?text=")[1]);
    assert.match(enDecoded, /\*Samsung Galaxy S25\*/);
    assert.match(enDecoded, /Variant: 256GB Black/);
    assert.match(enDecoded, /Total Order Amount: QAR 7,000/);

    const arUrl = generateCartWhatsAppUrl({ items, total: 7000, locale: "ar" });
    const arDecoded = decodeURIComponent(arUrl.split("?text=")[1]);
    assert.match(arDecoded, /\*سامسونج جالاكسي إس 25\*/);
    assert.match(arDecoded, /الخيار: 256 جيجابايت أسود/);
    assert.match(arDecoded, /إجمالي مبلغ الطلب: 7,000 ر\.ق/);
    assert.match(arDecoded, /طريقة الدفع: الدفع عند الاستلام/);
  });
});

describe("Phase 3B: Page Navigation, RTL Classes & Translation Key Parity", () => {
  const phase3bPages = [
    "src/app/(storefront)/[locale]/cart/page.tsx",
    "src/app/(storefront)/[locale]/checkout/page.tsx",
    "src/app/(storefront)/[locale]/order-success/[ref]/page.tsx",
  ];

  it("all Phase 3B pages use @/i18n/navigation and logical RTL-safe classes", () => {
    for (const relPath of phase3bPages) {
      const src = fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8");
      assert.doesNotMatch(src, /from\s+["']next\/link["']/, `${relPath} must not import next/link`);
      assert.match(src, /from\s+["']@\/i18n\/navigation["']/, `${relPath} must import from @/i18n/navigation`);
    }

    const checkoutSrc = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/app/(storefront)/[locale]/checkout/page.tsx"),
      "utf8"
    );
    assert.doesNotMatch(
      checkoutSrc,
      /from\s+["']next\/navigation["'][^;]*\buseRouter\b/,
      "checkout/page.tsx must import useRouter from @/i18n/navigation"
    );
    assert.doesNotMatch(checkoutSrc, /\bright-3\.5\b/, "checkout icons must use end-3.5 instead of right-3.5");
    assert.match(checkoutSrc, /\bend-3\.5\b/, "checkout icons must use logical end-3.5");
  });

  it("every static translation key referenced in Phase 3B pages exists in both en.json and ar.json", () => {
    const clientSpecs = [
      { file: "src/app/(storefront)/[locale]/cart/page.tsx", varName: "tCart", ns: "cart" },
      { file: "src/app/(storefront)/[locale]/checkout/page.tsx", varName: "tCheckout", ns: "checkout" },
      { file: "src/app/(storefront)/[locale]/order-success/[ref]/page.tsx", varName: "tSuccess", ns: "orderSuccess" },
    ];

    for (const { file, varName, ns } of clientSpecs) {
      const src = fs.readFileSync(path.join(PROJECT_ROOT, file), "utf8");
      const regex = new RegExp(`\\b${varName}\\(\\s*["']([^"']+)["']`, "g");
      const matches = Array.from(src.matchAll(regex));
      assert.ok(matches.length > 0, `Expected translation calls in ${file}`);
      for (const [, key] of matches) {
        const enVal = lookupMessage(enMessages[ns], key);
        const arVal = lookupMessage(arMessages[ns], key);
        assert.ok(enVal && enVal.trim().length > 0, `${file}: missing EN key '${ns}.${key}'`);
        assert.ok(arVal && arVal.trim().length > 0, `${file}: missing AR key '${ns}.${key}'`);
      }
    }
  });
});
