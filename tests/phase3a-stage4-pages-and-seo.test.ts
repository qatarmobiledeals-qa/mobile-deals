import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import type * as SitemapMod from "../src/app/sitemap.ts";
import type * as AdminActionsMod from "../src/app/actions/admin.ts";

const require = createRequire(import.meta.url);
const Module = require("node:module");
const React = require("react") as typeof import("react");
const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");

const enMessages = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, "src/messages/en.json"), "utf8")
) as Record<string, Record<string, unknown>>;
const arMessages = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, "src/messages/ar.json"), "utf8")
) as Record<string, Record<string, unknown>>;

function lookupMessage(messages: Record<string, unknown>, keyPath: string): string {
  const parts = keyPath.split(".");
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return keyPath;
    }
  }
  return typeof cur === "string" ? cur : keyPath;
}

// ---------------------------------------------------------------------------
// Shared Mock State for Stage 4 Server Pages, Sitemap & Admin Revalidation
// ---------------------------------------------------------------------------

interface RevalidateCall {
  path: string;
  type?: string;
}

let revalidateCalls: RevalidateCall[] = [];
let setRequestLocaleCalls: string[] = [];
let redirectCalls: Array<{ href: string; locale?: string } | string> = [];
let mockAdminSession: { email: string; role: string } | null = {
  email: "admin@qatarmobiles.qa",
  role: "admin",
};
let mockThrowProductDeleteError = false;

interface MockTableData {
  products: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  brands: Record<string, unknown>[];
  banners: Record<string, unknown>[];
  site_settings: Record<string, unknown>[];
  product_images: Record<string, unknown>[];
  product_variants: Record<string, unknown>[];
}

function createDefaultMockData(): MockTableData {
  const categorySmartphones = {
    id: "cat-smartphones",
    name: "Smartphones",
    name_ar: "هواتف ذكية",
    slug: "smartphones",
    description: "Latest flagship phones in Qatar",
    description_ar: "أحدث الهواتف الرائدة في قطر",
    image_url: "https://cdn.example.com/cat-phones.jpg",
    is_active: true,
    display_order: 1,
    updated_at: "2026-06-01T10:00:00Z",
    arabic_updated_at: "2026-06-05T12:00:00Z",
  };

  const categoryFallback = {
    id: "cat-accessories",
    name: "Chargers & Cables",
    name_ar: null,
    slug: "chargers-cables",
    description: "Fast chargers and cables",
    description_ar: null,
    image_url: null,
    is_active: true,
    display_order: 2,
    updated_at: "2026-06-02T10:00:00Z",
    arabic_updated_at: null,
  };

  const brandSamsung = {
    id: "brand-samsung",
    name: "Samsung",
    name_ar: "سامسونج",
    slug: "samsung",
    is_active: true,
    display_order: 1,
  };

  return {
    categories: [categorySmartphones, categoryFallback],
    brands: [brandSamsung],
    banners: [
      {
        id: "banner-1",
        title: "Eid Tech Deals",
        title_ar: "عروض العيد التقنية",
        highlighted_text: "Up to 25% Off",
        highlighted_text_ar: "خصم يصل إلى 25%",
        description: "Official warranty across Qatar",
        description_ar: "ضمان رسمي في قطر",
        desktop_image_url: "https://cdn.example.com/banner.jpg",
        position: "hero",
        display_order: 1,
        is_active: true,
      },
    ],
    products: [
      {
        id: "prod-s25",
        name: "Galaxy S25 Ultra",
        name_ar: "جالاكسي إس 25 ألترا",
        slug: "galaxy-s25-ultra",
        short_description: "Flagship titanium smartphone",
        short_description_ar: "هاتف رائد من التيتانيوم",
        description: "English full description",
        description_ar: "الوصف الكامل باللغة العربية",
        sku: "SAM-S25U",
        price: 4699,
        compare_at_price: 4999,
        stock: 12,
        stock_quantity: 12,
        category_id: "cat-smartphones",
        brand_id: "brand-samsung",
        is_active: true,
        is_featured: true,
        is_best_seller: true,
        is_best_deal: false,
        specifications: {
          Screen: "6.8 AMOLED",
          Processor: "Snapdragon 8 Elite",
          gift_enabled: "true",
          gift_image: "https://cdn.example.com/gift.png",
        },
        specifications_ar: {
          Screen: "شاشة 6.8 أموليد",
          Processor: "سناب دراجون 8 إيليت",
          gift_enabled: "true",
        },
        updated_at: "2026-06-03T08:00:00Z",
        arabic_updated_at: "2026-06-10T15:30:00Z",
        category: categorySmartphones,
        categories: categorySmartphones,
        brand: brandSamsung,
        brands: brandSamsung,
        product_images: [
          {
            id: "img-1",
            image_url: "https://cdn.example.com/s25.jpg",
            alt_text: "Galaxy S25 front",
            alt_text_ar: "صورة أمامية جالاكسي إس 25",
            is_primary: true,
            display_order: 1,
          },
        ],
        product_variants: [
          {
            id: "var-1",
            name: "256GB Titanium",
            name_ar: "256 جيجابايت تيتانيوم",
            price: 4699,
            stock_quantity: 5,
            is_active: true,
          },
        ],
      },
      {
        id: "prod-pixel",
        name: "Pixel 10 Pro",
        name_ar: null,
        slug: "pixel-10-pro",
        short_description: "Pure Google smartphone",
        short_description_ar: null,
        description: "English Pixel description",
        description_ar: null,
        sku: "GOOG-P10P",
        price: 3599,
        compare_at_price: null,
        stock: 8,
        stock_quantity: 8,
        category_id: "cat-smartphones",
        brand_id: "brand-samsung",
        is_active: true,
        is_featured: true,
        is_best_seller: false,
        is_best_deal: false,
        specifications: null,
        specifications_ar: null,
        updated_at: "2026-06-04T09:00:00Z",
        arabic_updated_at: null,
        category: categorySmartphones,
        categories: categorySmartphones,
        brand: brandSamsung,
        brands: brandSamsung,
        product_images: [
          {
            id: "img-pixel",
            image_url: "https://cdn.example.com/pixel.jpg",
            alt_text: "Pixel 10 rear view",
            alt_text_ar: null,
            is_primary: true,
            display_order: 1,
          },
        ],
        product_variants: [],
      },
    ],
    product_images: [],
    product_variants: [],
    site_settings: [
      {
        key: "general",
        is_public: true,
        value: {
          store_name: "Mobile Deals",
          whatsapp_number: "+97450000000",
          currency: "QAR",
          hero_enabled: true,
          announcement_bar: {
            enabled: true,
            items: ["Free Delivery in Doha"],
            items_ar: ["توصيل مجاني داخل الدوحة"],
          },
        },
      },
      {
        key: "announcement_bar",
        is_public: true,
        value: {
          enabled: true,
          items: ["Free Delivery in Doha"],
          items_ar: ["توصيل مجاني داخل الدوحة"],
        },
      },
      {
        key: "trust_badges",
        is_public: true,
        value: { items: [] },
      },
    ],
  };
}

let mockDb: MockTableData = createDefaultMockData();

function createMockSupabaseClient() {
  return {
    from(tableName: string) {
      const filters: Array<{ col: string; val: unknown; op: "eq" | "in" | "neq" }> = [];
      let searchPattern = "";
      let isMutation = false;
      let pendingUpdatePayload: Record<string, unknown> | null = null;

      const getRows = (): Record<string, unknown>[] => {
        const list = (mockDb as unknown as Record<string, Record<string, unknown>[]>)[tableName] || [];
        return list.filter((row) => {
          for (const f of filters) {
            if (f.op === "eq" && row[f.col] !== f.val) return false;
            if (f.op === "neq" && row[f.col] === f.val) return false;
            if (f.op === "in" && Array.isArray(f.val) && !f.val.includes(row[f.col])) return false;
          }
          if (searchPattern && tableName === "products") {
            const needle = searchPattern.toLowerCase();
            const haystack = [row.name, row.name_ar, row.short_description, row.short_description_ar]
              .filter((v): v is string => typeof v === "string")
              .join(" ")
              .toLowerCase();
            if (!haystack.includes(needle)) return false;
          }
          return true;
        });
      };

      const applyPendingUpdate = () => {
        if (!pendingUpdatePayload) return;
        const payload = pendingUpdatePayload;
        pendingUpdatePayload = null;
        for (const row of getRows()) {
          for (const [k, v] of Object.entries(payload)) {
            if (v !== undefined) {
              row[k] = v;
            }
          }
          if (tableName === "products" && "category_id" in payload) {
            const matchedCat =
              mockDb.categories.find((c) => c.id === row.category_id) ?? null;
            row.category = matchedCat;
            row.categories = matchedCat;
          }
        }
      };

      const makeMutationDefaultRow = (): Record<string, unknown> => {
        if (tableName === "products") {
          return {
            id: "prod-s25",
            slug: "galaxy-s25-ultra",
            category_id: "cat-smartphones",
            category: mockDb.categories.find((c) => c.id === "cat-smartphones") ?? null,
            categories: mockDb.categories.find((c) => c.id === "cat-smartphones") ?? null,
          };
        }
        if (tableName === "categories") {
          return { id: "cat-smartphones", slug: "smartphones" };
        }
        if (tableName === "brands") {
          return { id: "brand-samsung", slug: "samsung" };
        }
        if (tableName === "banners") {
          return { id: "banner-1", desktop_image_url: null, mobile_image_url: null, cloudinary_public_id: null };
        }
        return { id: "row-1", slug: "sample-slug" };
      };

      const builder: Record<string, unknown> = {
        select() {
          return builder;
        },
        insert(payload: Record<string, unknown>) {
          isMutation = true;
          const inserted = { ...makeMutationDefaultRow(), ...payload };
          if (tableName === "products") {
            const matchedCat =
              "category_id" in payload
                ? mockDb.categories.find((c) => c.id === payload.category_id) ?? null
                : null;
            inserted.category = matchedCat;
            inserted.categories = matchedCat;
          }
          if (tableName === "products" || tableName === "categories" || tableName === "brands") {
            const list = (mockDb as unknown as Record<string, Record<string, unknown>[]>)[tableName];
            list?.push(inserted);
          }
          return builder;
        },
        update(payload: Record<string, unknown>) {
          isMutation = true;
          pendingUpdatePayload = payload;
          return builder;
        },
        upsert() {
          isMutation = true;
          return builder;
        },
        delete() {
          isMutation = true;
          if (mockThrowProductDeleteError && tableName === "products") {
            return {
              eq: async () => ({ error: new Error("delete failed") }),
            };
          }
          return builder;
        },
        eq(col: string, val: unknown) {
          filters.push({ col, val, op: "eq" });
          return builder;
        },
        neq(col: string, val: unknown) {
          filters.push({ col, val, op: "neq" });
          return builder;
        },
        in(col: string, vals: unknown[]) {
          filters.push({ col, val: vals, op: "in" });
          return builder;
        },
        or(expr: string) {
          const match = /ilike\.\"?[*%]([^*%\"]+)[*%]"?/i.exec(expr);
          if (match) {
            searchPattern = match[1].replaceAll("\\", "");
          }
          return builder;
        },
        ilike(_col: string, pattern: string) {
          searchPattern = pattern.replace(/%/g, "");
          return builder;
        },
        gt() {
          return builder;
        },
        gte() {
          return builder;
        },
        lt() {
          return builder;
        },
        lte() {
          return builder;
        },
        order() {
          return builder;
        },
        limit() {
          return builder;
        },
        range() {
          return builder;
        },
        async single() {
          applyPendingUpdate();
          const rows = getRows();
          const row = rows[0] ?? (isMutation ? makeMutationDefaultRow() : null);
          return { data: row ? JSON.parse(JSON.stringify(row)) : null, error: null };
        },
        async maybeSingle() {
          applyPendingUpdate();
          const rows = getRows();
          const row = rows[0] ?? (isMutation ? makeMutationDefaultRow() : null);
          return { data: row ? JSON.parse(JSON.stringify(row)) : null, error: null };
        },
        then(
          onFulfilled: (res: { data: unknown; count: number; error: null }) => unknown,
          onRejected?: (err: unknown) => unknown
        ) {
          applyPendingUpdate();
          const rows = JSON.parse(JSON.stringify(getRows())) as Record<string, unknown>[];
          return Promise.resolve({ data: rows, count: rows.length, error: null }).then(
            onFulfilled,
            onRejected
          );
        },
      };

      return builder;
    },
  };
}

// ---------------------------------------------------------------------------
// TypeScript Module Loader with Stage 4 Framework Mocks
// ---------------------------------------------------------------------------

const transpiledCache = new Map<string, Record<string, unknown>>();

function resolveAliasOrRelative(request: string, parentFilename?: string): string | null {
  if (request.startsWith("@/")) {
    const base = path.join(PROJECT_ROOT, "src", request.slice(2));
    for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
      const candidate = base + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
  }
  if ((request.startsWith("./") || request.startsWith("../")) && parentFilename) {
    const base = path.resolve(path.dirname(parentFilename), request);
    for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
      const candidate = base + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
  }
  return null;
}

function createStubComponent(displayName: string) {
  const Comp = (props: Record<string, unknown>) =>
    React.createElement("mock-component", { "data-component": displayName, ...props });
  Comp.displayName = displayName;
  return Comp;
}

function loadModuleWithMocks<T = Record<string, unknown>>(filePath: string): T {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
  if (transpiledCache.has(absPath)) {
    return transpiledCache.get(absPath) as T;
  }

  const originalLoad = Module._load;
  Module._load = function patchedLoad(
    request: string,
    parent: { filename?: string } | null,
    isMain: boolean
  ) {
    if (request === "next/cache") {
      return {
        __esModule: true,
        revalidatePath: (targetPath: string, type?: string) => {
          revalidateCalls.push({ path: targetPath, type });
        },
        unstable_cache: <F extends (...args: unknown[]) => unknown>(fn: F) => fn,
      };
    }

    if (request === "next-intl/server") {
      return {
        __esModule: true,
        setRequestLocale: (locale: string) => {
          setRequestLocaleCalls.push(locale);
        },
        getTranslations: async (opts: string | { locale?: string; namespace: string }) => {
          const locale = typeof opts === "string" ? "en" : opts.locale || "en";
          const namespace = typeof opts === "string" ? opts : opts.namespace;
          const msgs = locale === "ar" ? arMessages : enMessages;
          const nsObj = (msgs[namespace] || {}) as Record<string, unknown>;
          return (key: string, values?: Record<string, string | number>) => {
            let text = lookupMessage(nsObj, key);
            if (values) {
              for (const [k, v] of Object.entries(values)) {
                text = text.replaceAll(`{${k}}`, String(v));
              }
            }
            return text;
          };
        },
      };
    }

    if (request === "@/i18n/navigation") {
      return {
        __esModule: true,
        Link: ({
          href,
          children,
          ...rest
        }: {
          href: string;
          children?: React.ReactNode;
          [k: string]: unknown;
        }) => React.createElement("a", { href, ...rest }, children),
        redirect: (arg: { href: string; locale?: string } | string) => {
          redirectCalls.push(arg);
          throw new Error("NEXT_REDIRECT");
        },
      };
    }

    if (request === "next/navigation") {
      return {
        __esModule: true,
        notFound: () => {
          throw new Error("NEXT_NOT_FOUND");
        },
      };
    }

    if (request === "next/headers") {
      return {
        __esModule: true,
        cookies: async () => ({ get: () => undefined }),
        headers: async () => new Map(),
      };
    }

    if (request === "lucide-react") {
      return new Proxy(
        {},
        {
          get(_t, prop: string) {
            return createStubComponent(`Icon:${prop}`);
          },
        }
      );
    }

    if (request === "@/lib/supabase/server") {
      return {
        __esModule: true,
        createClient: async () => createMockSupabaseClient(),
        createPublicClient: () => createMockSupabaseClient(),
      };
    }

    if (request === "@/lib/supabase/admin") {
      return {
        __esModule: true,
        createAdminClient: () => createMockSupabaseClient(),
      };
    }

    if (request === "./auth" && parent?.filename?.endsWith(path.join("actions", "admin.ts"))) {
      return {
        __esModule: true,
        getAdminSession: async () => mockAdminSession,
      };
    }

    if (request === "./cloudinary" && parent?.filename?.endsWith(path.join("actions", "admin.ts"))) {
      return {
        __esModule: true,
        deleteCloudinaryImageAction: async () => ({ success: true }),
        deleteMultipleCloudinaryImagesAction: async () => ({ success: true }),
      };
    }

    // Stub heavy storefront client components when loading server pages so prop inspection stays crisp
    if (request.startsWith("@/components/store/")) {
      return new Proxy(
        {},
        {
          get(_target, prop: string) {
            if (prop === "__esModule") return true;
            return createStubComponent(prop);
          },
        }
      );
    }

    const resolvedLocal = resolveAliasOrRelative(request, parent?.filename);
    if (resolvedLocal && (resolvedLocal.endsWith(".ts") || resolvedLocal.endsWith(".tsx"))) {
      return loadModuleWithMocks(resolvedLocal);
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const source = fs.readFileSync(absPath, "utf8");
    const transpiled = ts.transpileModule(source, {
      fileName: absPath,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    });

    const mod = new Module(absPath);
    mod.filename = absPath;
    mod.paths = Module._nodeModulePaths(path.dirname(absPath));
    transpiledCache.set(absPath, mod.exports);
    mod._compile(transpiled.outputText, absPath);
    transpiledCache.set(absPath, mod.exports);
    return mod.exports as T;
  } finally {
    Module._load = originalLoad;
  }
}

interface ElementMatch {
  typeName: string;
  props: Record<string, unknown>;
}

function collectElements(node: unknown, out: ElementMatch[] = []): ElementMatch[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const item of node) collectElements(item, out);
    return out;
  }
  const el = node as { type?: unknown; props?: Record<string, unknown> };
  if (el.type !== undefined) {
    let typeName = "";
    if (typeof el.type === "string") {
      typeName = el.type;
    } else if (typeof el.type === "function") {
      const fn = el.type as { displayName?: string; name?: string };
      typeName = fn.displayName || fn.name || "";
    }
    out.push({ typeName, props: el.props || {} });
  }
  if (el.props && "children" in el.props) {
    collectElements(el.props.children, out);
  }
  return out;
}

function collectText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  const el = node as { props?: Record<string, unknown> };
  return el.props && "children" in el.props ? collectText(el.props.children) : "";
}

// ---------------------------------------------------------------------------
// SUITE 1: Stage 4 Server Pages Routing, Caching & Phase 3B Quarantine Contracts
// ---------------------------------------------------------------------------

describe("Stage 4: Server Pages Contract & Phase 3B Quarantine", () => {
  const stage4Pages = [
    "src/app/(storefront)/[locale]/page.tsx",
    "src/app/(storefront)/[locale]/shop/page.tsx",
    "src/app/(storefront)/[locale]/products/page.tsx",
    "src/app/(storefront)/[locale]/categories/[slug]/page.tsx",
    "src/app/(storefront)/[locale]/products/[slug]/page.tsx",
    "src/app/(storefront)/[locale]/search/page.tsx",
  ];

  const announcementBarPages = [
    "src/app/(storefront)/[locale]/page.tsx",
    "src/app/(storefront)/[locale]/shop/page.tsx",
    "src/app/(storefront)/[locale]/categories/[slug]/page.tsx",
    "src/app/(storefront)/[locale]/products/[slug]/page.tsx",
    "src/app/(storefront)/[locale]/search/page.tsx",
  ];

  it("all 6 Stage 4 server pages call setRequestLocale and preserve @/i18n/navigation contract", () => {
    for (const relPath of stage4Pages) {
      const src = fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8");
      assert.match(src, /setRequestLocale\s*\(\s*locale\s*\)/, `${relPath} must call setRequestLocale(locale)`);
      assert.doesNotMatch(src, /from\s+["']next\/link["']/, `${relPath} must not import next/link`);
      assert.doesNotMatch(
        src,
        /from\s+["']next\/navigation["'][^;]*\bredirect\b/,
        `${relPath} must not import redirect from next/navigation`
      );
      assert.doesNotMatch(
        src,
        /force-dynamic/,
        `${relPath} must not introduce force-dynamic caching bypass`
      );
    }
  });

  it("cached catalog pages preserve 24-hour ISR revalidate = 86400", () => {
    const isrPages = [
      "src/app/(storefront)/[locale]/page.tsx",
      "src/app/(storefront)/[locale]/shop/page.tsx",
      "src/app/(storefront)/[locale]/categories/[slug]/page.tsx",
      "src/app/(storefront)/[locale]/products/[slug]/page.tsx",
    ];
    for (const relPath of isrPages) {
      const src = fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8");
      assert.match(src, /export\s+const\s+revalidate\s*=\s*86400\b/, `${relPath} must keep revalidate = 86400`);
    }
  });

  it("all 5 storefront pages rendering AnnouncementBar pass itemsAr (F-04 compliance)", () => {
    for (const relPath of announcementBarPages) {
      const src = fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8");
      assert.match(src, /<AnnouncementBar[\s\S]*itemsAr=\{/, `${relPath} must pass itemsAr to AnnouncementBar`);
    }
  });

  it("Phase 3B checkout/cart/order/whatsapp files remain completely unlocalized/quarantined", () => {
    const whatsappSrc = fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/whatsapp.ts"), "utf8");
    assert.doesNotMatch(whatsappSrc, /next-intl/, "whatsapp.ts must remain untouched in Phase 3A");

    for (const phase3bPath of [
      "src/app/(storefront)/[locale]/cart/page.tsx",
      "src/app/(storefront)/[locale]/checkout/page.tsx",
      "src/app/(storefront)/[locale]/order-success/[ref]/page.tsx",
    ]) {
      const src = fs.readFileSync(path.join(PROJECT_ROOT, phase3bPath), "utf8");
      assert.doesNotMatch(src, /useTranslations|getTranslations/, `${phase3bPath} must stay quarantined in Phase 3A`);
    }
  });
});

// ---------------------------------------------------------------------------
// SUITE 2: Server Page Metadata, Bilingual Resolver & F-04 Runtime Execution
// ---------------------------------------------------------------------------

describe("Stage 4: Server Pages Runtime Metadata, RSC Rendering & Redirects", () => {
  beforeEach(() => {
    revalidateCalls = [];
    setRequestLocaleCalls = [];
    redirectCalls = [];
    mockDb = createDefaultMockData();
  });

  afterEach(() => {
    transpiledCache.clear();
  });

  it("HomePage generates localized EN/AR metadata, OpenGraph alt, JSON-LD store name/description, and forwards itemsAr + currency", async () => {
    const homeMod = loadModuleWithMocks<{
      default: (props: { params: Promise<{ locale: string }> }) => Promise<unknown>;
      generateMetadata: (props: { params: Promise<{ locale: string }> }) => Promise<{
        title?: { absolute?: string } | string;
        description?: string;
        alternates?: { canonical?: string; languages?: Record<string, string> };
        openGraph?: {
          title?: string;
          description?: string;
          images?: Array<{ url: string; alt?: string }>;
        };
      }>;
    }>("src/app/(storefront)/[locale]/page.tsx");

    const enMeta = await homeMod.generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    const arMeta = await homeMod.generateMetadata({ params: Promise.resolve({ locale: "ar" }) });

    assert.deepEqual(enMeta.title, { absolute: lookupMessage(enMessages, "metadata.siteTitle") });
    assert.deepEqual(arMeta.title, { absolute: lookupMessage(arMessages, "metadata.siteTitle") });
    assert.equal(enMeta.openGraph?.title, lookupMessage(enMessages, "metadata.homeTitle"));
    assert.equal(arMeta.openGraph?.title, lookupMessage(arMessages, "metadata.homeTitle"));
    assert.equal(enMeta.openGraph?.images?.[0]?.alt, lookupMessage(enMessages, "common.storeNameQatar"));
    assert.equal(arMeta.openGraph?.images?.[0]?.alt, lookupMessage(arMessages, "common.storeNameQatar"));
    assert.notEqual(arMeta.description, enMeta.description);
    assert.equal(enMeta.alternates?.canonical, "https://mobiledealsqa.com/en");
    assert.equal(enMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en");
    assert.equal(enMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar");
    assert.equal(enMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en");
    assert.equal(arMeta.alternates?.canonical, "https://mobiledealsqa.com/ar");
    assert.equal(arMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en");
    assert.equal(arMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar");
    assert.equal(arMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en");

    const parseJsonLdScripts = (tree: unknown) => {
      const elements = collectElements(tree);
      return elements
        .filter((el) => el.typeName === "script" && el.props.type === "application/ld+json")
        .map((script) =>
          JSON.parse(
            String(
              (script.props.dangerouslySetInnerHTML as { __html?: string } | undefined)?.__html ||
                "{}"
            )
          ) as Record<string, unknown>
        );
    };

    const enTree = await homeMod.default({ params: Promise.resolve({ locale: "en" }) });
    const enSchemas = parseJsonLdScripts(enTree);
    const enStoreSchema = enSchemas.find((s) => s["@type"] === "OnlineStore");
    const enWebSchema = enSchemas.find((s) => s["@type"] === "WebSite");
    assert.equal(enStoreSchema?.name, lookupMessage(enMessages, "common.storeNameQatar"));
    assert.equal(enStoreSchema?.description, lookupMessage(enMessages, "metadata.siteDescription"));
    assert.equal(enWebSchema?.name, lookupMessage(enMessages, "common.storeNameQatar"));

    const arTree = await homeMod.default({ params: Promise.resolve({ locale: "ar" }) });
    assert.ok(setRequestLocaleCalls.includes("ar"));

    const elements = collectElements(arTree);
    const announcement = elements.find((el) => el.typeName === "AnnouncementBar");
    assert.ok(announcement, "HomePage must render AnnouncementBar");
    assert.deepEqual(announcement.props.itemsAr, ["توصيل مجاني داخل الدوحة"]);
    assert.equal(announcement.props.currency, "QAR");

    const arSchemas = parseJsonLdScripts(arTree);
    const arStoreSchema = arSchemas.find((s) => s["@type"] === "OnlineStore");
    const arWebSchema = arSchemas.find((s) => s["@type"] === "WebSite");
    assert.equal(arStoreSchema?.name, lookupMessage(arMessages, "common.storeNameQatar"));
    assert.equal(arStoreSchema?.description, lookupMessage(arMessages, "metadata.siteDescription"));
    assert.equal(arStoreSchema?.url, "https://mobiledealsqa.com/ar");
    assert.equal(arWebSchema?.name, lookupMessage(arMessages, "common.storeNameQatar"));
    assert.equal(arWebSchema?.url, "https://mobiledealsqa.com/ar");
  });

  it("ShopPage generates localized metadata, canonical/alternates, and renders Suspense fallback + itemsAr", async () => {
    const shopMod = loadModuleWithMocks<{
      default: (props: { params: Promise<{ locale: string }> }) => Promise<unknown>;
      generateMetadata: (props: { params: Promise<{ locale: string }> }) => Promise<{
        title?: string;
        alternates?: { canonical?: string; languages?: Record<string, string> };
      }>;
    }>("src/app/(storefront)/[locale]/shop/page.tsx");

    const enMeta = await shopMod.generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    assert.equal(enMeta.title, lookupMessage(enMessages, "shop.metaTitle"));
    assert.equal(enMeta.alternates?.canonical, "https://mobiledealsqa.com/en/shop");
    assert.equal(enMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en/shop");
    assert.equal(enMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar/shop");
    assert.equal(enMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en/shop");

    const arMeta = await shopMod.generateMetadata({ params: Promise.resolve({ locale: "ar" }) });
    assert.equal(arMeta.title, lookupMessage(arMessages, "shop.metaTitle"));
    assert.equal(arMeta.alternates?.canonical, "https://mobiledealsqa.com/ar/shop");
    assert.equal(arMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en/shop");
    assert.equal(arMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar/shop");
    assert.equal(arMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en/shop");

    const tree = await shopMod.default({ params: Promise.resolve({ locale: "ar" }) });
    const elements = collectElements(tree);
    const announcement = elements.find((el) => el.typeName === "AnnouncementBar");
    assert.deepEqual(announcement?.props.itemsAr, ["توصيل مجاني داخل الدوحة"]);
  });

  it("AllProductsPage sets locale and redirects via @/i18n/navigation with locale preserved", async () => {
    const productsMod = loadModuleWithMocks<{
      default: (props: { params: Promise<{ locale: string }> }) => Promise<unknown>;
    }>("src/app/(storefront)/[locale]/products/page.tsx");

    await assert.rejects(
      () => productsMod.default({ params: Promise.resolve({ locale: "ar" }) }),
      /NEXT_REDIRECT/
    );
    assert.ok(setRequestLocaleCalls.includes("ar"));
    assert.deepEqual(redirectCalls[0], { href: "/shop", locale: "ar" });

    redirectCalls = [];
    await assert.rejects(
      () => productsMod.default({ params: Promise.resolve({ locale: "en" }) }),
      /NEXT_REDIRECT/
    );
    assert.deepEqual(redirectCalls[0], { href: "/shop", locale: "en" });
  });

  it("CategoryPage resolves Arabic category name/JSON-LD, alternates, fallback, and notFound() for invalid slugs", async () => {
    const categoryMod = loadModuleWithMocks<{
      default: (props: { params: Promise<{ locale: string; slug: string }> }) => Promise<unknown>;
      generateMetadata: (props: { params: Promise<{ locale: string; slug: string }> }) => Promise<{
        title?: string;
        description?: string;
        alternates?: { canonical?: string; languages?: Record<string, string> };
      }>;
    }>("src/app/(storefront)/[locale]/categories/[slug]/page.tsx");

    const enMeta = await categoryMod.generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "smartphones" }),
    });
    assert.match(enMeta.title || "", /Smartphones/);
    assert.equal(enMeta.alternates?.canonical, "https://mobiledealsqa.com/en/categories/smartphones");
    assert.equal(enMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en/categories/smartphones");
    assert.equal(enMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar/categories/smartphones");
    assert.equal(enMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en/categories/smartphones");

    // Category with Arabic
    const arMeta = await categoryMod.generateMetadata({
      params: Promise.resolve({ locale: "ar", slug: "smartphones" }),
    });
    assert.match(arMeta.title || "", /هواتف ذكية/);
    assert.equal(arMeta.alternates?.canonical, "https://mobiledealsqa.com/ar/categories/smartphones");
    assert.equal(arMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en/categories/smartphones");
    assert.equal(arMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar/categories/smartphones");
    assert.equal(arMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en/categories/smartphones");

    // Category without Arabic -> English fallback
    const fallbackMeta = await categoryMod.generateMetadata({
      params: Promise.resolve({ locale: "ar", slug: "chargers-cables" }),
    });
    assert.match(fallbackMeta.title || "", /Chargers & Cables/);

    // Invalid category slug -> localized notFound metadata & notFound() throw
    const missingMeta = await categoryMod.generateMetadata({
      params: Promise.resolve({ locale: "ar", slug: "nonexistent-category" }),
    });
    assert.equal(missingMeta.title, lookupMessage(arMessages, "shop.categoryNotFound"));
    await assert.rejects(
      () => categoryMod.default({ params: Promise.resolve({ locale: "ar", slug: "nonexistent-category" }) }),
      /NEXT_NOT_FOUND/
    );

    const tree = await categoryMod.default({
      params: Promise.resolve({ locale: "ar", slug: "smartphones" }),
    });
    const elements = collectElements(tree);
    const announcement = elements.find((el) => el.typeName === "AnnouncementBar");
    assert.deepEqual(announcement?.props.itemsAr, ["توصيل مجاني داخل الدوحة"]);

    const catalog = elements.find((el) => el.typeName === "ShopCatalogClient");
    assert.equal(catalog?.props.initialCategoryName, "هواتف ذكية");

    const breadcrumbScript = elements.find(
      (el) => el.typeName === "script" && el.props.type === "application/ld+json"
    );
    const breadcrumbJson = JSON.parse(
      String(
        (breadcrumbScript?.props.dangerouslySetInnerHTML as { __html?: string } | undefined)
          ?.__html || "{}"
      )
    ) as { itemListElement?: Array<{ name?: string; item?: string }> };
    assert.equal(breadcrumbJson.itemListElement?.[0]?.name, lookupMessage(arMessages, "nav.home"));
    assert.equal(breadcrumbJson.itemListElement?.[1]?.name, lookupMessage(arMessages, "nav.shop"));
    assert.equal(breadcrumbJson.itemListElement?.[2]?.name, "هواتف ذكية");
    assert.equal(
      breadcrumbJson.itemListElement?.[2]?.item,
      "https://mobiledealsqa.com/ar/categories/smartphones"
    );
  });

  it("ProductDetailsPage localizes metadata, OpenGraph alt_text_ar, JSON-LD, specsAr, and triggers notFound() cleanly", async () => {
    const productMod = loadModuleWithMocks<{
      default: (props: { params: Promise<{ locale: string; slug: string }> }) => Promise<unknown>;
      generateMetadata: (props: { params: Promise<{ locale: string; slug: string }> }) => Promise<{
        title?: string;
        description?: string;
        alternates?: { canonical?: string; languages?: Record<string, string> };
        openGraph?: { images?: Array<{ url: string; alt?: string }> };
      }>;
    }>("src/app/(storefront)/[locale]/products/[slug]/page.tsx");

    const enMeta = await productMod.generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "galaxy-s25-ultra" }),
    });
    assert.equal(enMeta.openGraph?.images?.[0]?.alt, "Galaxy S25 front");
    assert.equal(enMeta.alternates?.canonical, "https://mobiledealsqa.com/en/products/galaxy-s25-ultra");
    assert.equal(enMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en/products/galaxy-s25-ultra");
    assert.equal(enMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar/products/galaxy-s25-ultra");
    assert.equal(enMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en/products/galaxy-s25-ultra");

    const arMeta = await productMod.generateMetadata({
      params: Promise.resolve({ locale: "ar", slug: "galaxy-s25-ultra" }),
    });
    assert.match(arMeta.title || "", /^جالاكسي إس 25 ألترا/);
    assert.equal(arMeta.description, "هاتف رائد من التيتانيوم");
    assert.equal(arMeta.openGraph?.images?.[0]?.alt, "صورة أمامية جالاكسي إس 25");
    assert.equal(arMeta.alternates?.canonical, "https://mobiledealsqa.com/ar/products/galaxy-s25-ultra");
    assert.equal(arMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en/products/galaxy-s25-ultra");
    assert.equal(arMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar/products/galaxy-s25-ultra");
    assert.equal(arMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en/products/galaxy-s25-ultra");

    // Product with English alt_text only falls back cleanly in Arabic
    const fallbackMeta = await productMod.generateMetadata({
      params: Promise.resolve({ locale: "ar", slug: "pixel-10-pro" }),
    });
    assert.match(fallbackMeta.title || "", /^Pixel 10 Pro/);
    assert.equal(fallbackMeta.openGraph?.images?.[0]?.alt, "Pixel 10 rear view");

    // Invalid product slug -> localized notFound metadata & notFound() throw
    const missingMeta = await productMod.generateMetadata({
      params: Promise.resolve({ locale: "ar", slug: "nonexistent-product" }),
    });
    assert.equal(missingMeta.title, lookupMessage(arMessages, "product.productNotFound"));
    await assert.rejects(
      () => productMod.default({ params: Promise.resolve({ locale: "ar", slug: "nonexistent-product" }) }),
      /NEXT_NOT_FOUND/
    );

    const tree = await productMod.default({
      params: Promise.resolve({ locale: "ar", slug: "galaxy-s25-ultra" }),
    });
    const elements = collectElements(tree);

    const gallery = elements.find((el) => el.typeName === "ProductGallery");
    assert.equal(gallery?.props.productName, "جالاكسي إس 25 ألترا");

    const specTabs = elements.find((el) => el.typeName === "ProductSpecTabs");
    assert.deepEqual(specTabs?.props.specs, {
      Screen: "6.8 AMOLED",
      Processor: "Snapdragon 8 Elite",
    });
    assert.deepEqual(specTabs?.props.specsAr, {
      Screen: "شاشة 6.8 أموليد",
      Processor: "سناب دراجون 8 إيليت",
    });
    assert.equal(specTabs?.props.descriptionAr, "الوصف الكامل باللغة العربية");

    const jsonLdScripts = elements
      .filter((el) => el.typeName === "script" && el.props.type === "application/ld+json")
      .map((s) =>
        JSON.parse(
          String(
            (s.props.dangerouslySetInnerHTML as { __html?: string } | undefined)?.__html || "{}"
          )
        ) as Record<string, unknown>
      );
    const productSchema = jsonLdScripts.find((s) => s["@type"] === "Product") as {
      name?: string;
      description?: string;
      url?: string;
      brand?: { name?: string };
      offers?: { seller?: { name?: string }; url?: string };
    };
    assert.equal(productSchema?.name, "جالاكسي إس 25 ألترا");
    assert.equal(productSchema?.description, "الوصف الكامل باللغة العربية");
    assert.equal(productSchema?.brand?.name, "سامسونج");
    assert.equal(productSchema?.offers?.seller?.name, lookupMessage(arMessages, "common.storeNameQatar"));
    assert.equal(productSchema?.url, "https://mobiledealsqa.com/ar/products/galaxy-s25-ultra");

    const breadcrumbSchema = jsonLdScripts.find((s) => s["@type"] === "BreadcrumbList") as {
      itemListElement?: Array<{ name?: string; item?: string }>;
    };
    assert.equal(breadcrumbSchema.itemListElement?.[0]?.name, lookupMessage(arMessages, "nav.home"));
    assert.equal(breadcrumbSchema.itemListElement?.[2]?.name, "هواتف ذكية");
    assert.equal(breadcrumbSchema.itemListElement?.[3]?.name, "جالاكسي إس 25 ألترا");

    const navText = collectText(tree);
    assert.match(navText, /الرئيسية/);
    assert.match(navText, /هواتف ذكية/);
    assert.match(navText, /جالاكسي إس 25 ألترا/);
  });

  it("SearchPage generates localized metadata/alternates, non-empty singular/plural results, and empty state", async () => {
    const searchMod = loadModuleWithMocks<{
      default: (props: {
        params: Promise<{ locale: string }>;
        searchParams: Promise<{ q?: string }>;
      }) => Promise<unknown>;
      generateMetadata: (props: {
        params: Promise<{ locale: string }>;
        searchParams: Promise<{ q?: string }>;
      }) => Promise<{
        title?: string;
        alternates?: { canonical?: string; languages?: Record<string, string> };
      }>;
    }>("src/app/(storefront)/[locale]/search/page.tsx");

    const enMeta = await searchMod.generateMetadata({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ q: "Galaxy" }),
    });
    assert.equal(enMeta.alternates?.canonical, "https://mobiledealsqa.com/en/search");
    assert.equal(enMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en/search");
    assert.equal(enMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar/search");
    assert.equal(enMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en/search");

    const arMeta = await searchMod.generateMetadata({
      params: Promise.resolve({ locale: "ar" }),
      searchParams: Promise.resolve({ q: "جالاكسي" }),
    });
    assert.match(arMeta.title || "", /جالاكسي/);
    assert.equal(arMeta.alternates?.canonical, "https://mobiledealsqa.com/ar/search");
    assert.equal(arMeta.alternates?.languages?.en, "https://mobiledealsqa.com/en/search");
    assert.equal(arMeta.alternates?.languages?.ar, "https://mobiledealsqa.com/ar/search");
    assert.equal(arMeta.alternates?.languages?.["x-default"], "https://mobiledealsqa.com/en/search");

    // Non-empty single match -> singular message + 1 ProductCard (not empty state)
    const singularTree = await searchMod.default({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ q: "Galaxy" }),
    });
    const singularCards = collectElements(singularTree).filter((el) => el.typeName === "ProductCard");
    assert.equal(singularCards.length, 1);
    const singularText = collectText(singularTree);
    assert.match(singularText, /Showing 1 result for "Galaxy"/);
    assert.doesNotMatch(singularText, /No exact matches found/);

    // Non-empty multi match -> plural message + 2 ProductCards in Arabic
    const pluralTree = await searchMod.default({
      params: Promise.resolve({ locale: "ar" }),
      searchParams: Promise.resolve({ q: "smartphone" }),
    });
    const pluralCards = collectElements(pluralTree).filter((el) => el.typeName === "ProductCard");
    assert.equal(pluralCards.length, 2);
    assert.match(collectText(pluralTree), /عرض 2 نتائج لـ "smartphone"/);

    // Empty search results
    const emptyTree = await searchMod.default({
      params: Promise.resolve({ locale: "ar" }),
      searchParams: Promise.resolve({ q: "nonexistent-device-xyz" }),
    });
    const text = collectText(emptyTree);
    assert.match(text, /لم يتم العثور على نتائج مطابقة/);

    const elements = collectElements(emptyTree);
    const announcement = elements.find((el) => el.typeName === "AnnouncementBar");
    assert.deepEqual(announcement?.props.itemsAr, ["توصيل مجاني داخل الدوحة"]);
  });
});

// ---------------------------------------------------------------------------
// SUITE 3: Sitemap Dual-Locale Entries, Alternates Consistency & Route Privacy
// ---------------------------------------------------------------------------

describe("Stage 4: Sitemap (/en & /ar) & Route Privacy", () => {
  beforeEach(() => {
    mockDb = createDefaultMockData();
  });

  it("createLocalizedSitemapEntries formats root and subpaths identically across canonicals and alternates", () => {
    const sitemapMod = loadModuleWithMocks<typeof SitemapMod>("src/app/sitemap.ts");
    const fixedDate = new Date("2026-06-01T00:00:00Z");

    const rootEntries = sitemapMod.createLocalizedSitemapEntries("/", fixedDate, "daily", 1.0);
    assert.equal(rootEntries.length, 2);
    const urls = rootEntries.map((e) => e.url);
    assert.ok(urls[0].endsWith("/en"));
    assert.ok(urls[1].endsWith("/ar"));
    // No trailing-slash mismatch between url and alternates.languages
    assert.equal(rootEntries[0].alternates?.languages?.en, rootEntries[0].url);
    assert.equal(rootEntries[0].alternates?.languages?.ar, rootEntries[1].url);
    assert.equal(rootEntries[0].alternates?.languages?.["x-default"], rootEntries[0].url);

    const shopEntries = sitemapMod.createLocalizedSitemapEntries("/shop", fixedDate, "daily", 0.9);
    assert.ok(shopEntries[0].url.endsWith("/en/shop"));
    assert.ok(shopEntries[1].url.endsWith("/ar/shop"));
    assert.equal(shopEntries[0].alternates?.languages?.ar, shopEntries[1].url);
  });

  it("sitemap() trims slugs, prevents duplicates, handles all date combinations, verifies alternates, and excludes private routes", async () => {
    mockDb.categories.push(
      {
        id: "cat-invalid",
        name: "Invalid Overlong",
        slug: "x".repeat(130),
        is_active: true,
        updated_at: "2026-06-01T00:00:00Z",
      },
      {
        id: "cat-whitespace-only",
        name: "Blank Slug",
        slug: "   ",
        is_active: true,
        updated_at: "2026-06-01T00:00:00Z",
      }
    );

    mockDb.products.push(
      {
        id: "prod-trimmed",
        name: "Trimmed Product",
        slug: "  trimmed-slug  ",
        is_active: true,
        updated_at: "2026-06-12T08:00:00Z",
        arabic_updated_at: "2026-06-01T08:00:00Z", // older than updated_at
      },
      {
        id: "prod-duplicate-trimmed",
        name: "Duplicate After Trim",
        slug: "trimmed-slug",
        is_active: true,
        updated_at: "2026-06-01T08:00:00Z",
        arabic_updated_at: null,
      },
      {
        id: "prod-invalid-dates",
        name: "Invalid Dates Product",
        slug: "invalid-dates-slug",
        is_active: true,
        updated_at: "not-a-valid-date",
        arabic_updated_at: "still-invalid",
      }
    );

    const sitemapMod = loadModuleWithMocks<typeof SitemapMod>("src/app/sitemap.ts");
    const entries = await sitemapMod.default();
    const urls = entries.map((e) => e.url);

    // Uniqueness check (including deduplication after trimming)
    assert.equal(new Set(urls).size, urls.length, "Sitemap must not contain duplicate URLs");

    assert.ok(urls.some((u) => u.endsWith("/en")));
    assert.ok(urls.some((u) => u.endsWith("/ar")));
    assert.ok(urls.some((u) => u.endsWith("/en/shop")));
    assert.ok(urls.some((u) => u.endsWith("/ar/shop")));
    assert.ok(urls.some((u) => u.endsWith("/en/about")));
    assert.ok(urls.some((u) => u.endsWith("/ar/about")));
    assert.ok(urls.some((u) => u.endsWith("/en/categories/smartphones")));
    assert.ok(urls.some((u) => u.endsWith("/ar/categories/smartphones")));
    assert.ok(urls.some((u) => u.endsWith("/en/products/galaxy-s25-ultra")));
    assert.ok(urls.some((u) => u.endsWith("/ar/products/galaxy-s25-ultra")));
    assert.ok(urls.some((u) => u === "https://mobiledealsqa.com/en/products/trimmed-slug"));
    assert.ok(urls.some((u) => u === "https://mobiledealsqa.com/ar/products/trimmed-slug"));

    // Whitespace-only & overlong slugs excluded
    assert.equal(urls.some((u) => u.includes("x".repeat(50))), false);
    assert.equal(urls.some((u) => /\s/.test(u)), false);

    // Every single entry carries complete alternates (en, ar, x-default)
    for (const entry of entries) {
      const langs = entry.alternates?.languages;
      assert.ok(langs?.en, `Missing en alternate for ${entry.url}`);
      assert.ok(langs?.ar, `Missing ar alternate for ${entry.url}`);
      assert.equal(langs?.["x-default"], langs?.en, `x-default must equal en for ${entry.url}`);
    }

    // Zero private / admin / Phase 3B checkout paths exposed
    for (const forbidden of ["/admin", "/api", "/cart", "/checkout", "/order-success", "/search"]) {
      assert.equal(
        urls.some((u) => u.includes(forbidden)),
        false,
        `Sitemap must not expose ${forbidden}`
      );
    }

    // 1. arabic_updated_at > updated_at -> picks arabic_updated_at
    const s25Entry = entries.find((e) => e.url.endsWith("/ar/products/galaxy-s25-ultra"));
    assert.equal(
      new Date(s25Entry?.lastModified || "").toISOString(),
      "2026-06-10T15:30:00.000Z"
    );

    // 2. updated_at > arabic_updated_at -> picks updated_at
    const trimmedEntry = entries.find((e) => e.url.endsWith("/en/products/trimmed-slug"));
    assert.equal(
      new Date(trimmedEntry?.lastModified || "").toISOString(),
      "2026-06-12T08:00:00.000Z"
    );

    // 3. missing/null arabic_updated_at -> picks updated_at
    const pixelEntry = entries.find((e) => e.url.endsWith("/ar/products/pixel-10-pro"));
    assert.equal(
      new Date(pixelEntry?.lastModified || "").toISOString(),
      "2026-06-04T09:00:00.000Z"
    );

    // 4. invalid date strings -> produces valid fallback Date (not NaN)
    const invalidDateEntry = entries.find((e) => e.url.endsWith("/en/products/invalid-dates-slug"));
    assert.ok(invalidDateEntry?.lastModified);
    assert.equal(Number.isNaN(new Date(invalidDateEntry.lastModified).getTime()), false);
  });
});

// ---------------------------------------------------------------------------
// SUITE 4: Dual-Locale On-Demand Revalidation in Admin Server Actions
// ---------------------------------------------------------------------------

describe("Stage 4: Admin Server Actions Dual-Locale Revalidation", () => {
  beforeEach(() => {
    revalidateCalls = [];
    mockAdminSession = { email: "admin@qatarmobiles.qa", role: "admin" };
    mockThrowProductDeleteError = false;
    mockDb = createDefaultMockData();
  });

  function assertRevalidatedBothLocales(basePath: string) {
    const called = new Set(revalidateCalls.map((c) => c.path));
    const suffix = basePath === "/" ? "" : basePath;
    assert.ok(called.has(`/en${suffix}`), `Expected revalidatePath('/en${suffix}')`);
    assert.ok(called.has(`/ar${suffix}`), `Expected revalidatePath('/ar${suffix}')`);
  }

  it("does NOT export synchronous helpers from 'use server' admin actions module", () => {
    const src = fs.readFileSync(path.join(PROJECT_ROOT, "src/app/actions/admin.ts"), "utf8");
    assert.doesNotMatch(
      src,
      /export\s+(async\s+)?function\s+revalidateStorefrontPath/,
      "revalidateStorefrontPath(s) helpers must remain module-private in Next.js 16 'use server' file"
    );
  });

  it("product actions (create, update, slug/category change, delete, toggle) revalidate old/new categories and products in both locales", async () => {
    const actions = loadModuleWithMocks<typeof AdminActionsMod>("src/app/actions/admin.ts");

    revalidateCalls = [];
    const createRes = await actions.createProductAction({
      name: "iPhone 17",
      slug: "iphone-17",
      price: 4299,
      category_id: "cat-smartphones",
    });
    assert.equal(createRes.success, true);
    assertRevalidatedBothLocales("/");
    assertRevalidatedBothLocales("/shop");
    assertRevalidatedBothLocales("/products/iphone-17");
    assertRevalidatedBothLocales("/categories/smartphones");

    // Unchanged category: revalidates /en/categories/smartphones & /ar/categories/smartphones once each
    revalidateCalls = [];
    const updateUnchangedRes = await actions.updateProductAction("prod-s25", {
      name: "Galaxy S25 Ultra Updated",
    });
    assert.equal(updateUnchangedRes.success, true);
    assertRevalidatedBothLocales("/");
    assertRevalidatedBothLocales("/shop");
    assertRevalidatedBothLocales("/products/galaxy-s25-ultra");
    assert.equal(
      revalidateCalls.filter((c) => c.path === "/en/categories/smartphones").length,
      1,
      "Unchanged category should not trigger duplicate /en category revalidations"
    );
    assert.equal(
      revalidateCalls.filter((c) => c.path === "/ar/categories/smartphones").length,
      1,
      "Unchanged category should not trigger duplicate /ar category revalidations"
    );

    // Product category reassignment + slug change: revalidates BOTH old and new category & product paths in both locales
    revalidateCalls = [];
    const reassignRes = await actions.updateProductAction("prod-s25", {
      category_id: "cat-accessories",
      slug: "galaxy-s25-ultra-reassigned",
    });
    assert.equal(reassignRes.success, true);
    assertRevalidatedBothLocales("/products/galaxy-s25-ultra");
    assertRevalidatedBothLocales("/products/galaxy-s25-ultra-reassigned");
    assertRevalidatedBothLocales("/categories/smartphones");
    assertRevalidatedBothLocales("/categories/chargers-cables");

    // Null category reassignment handles missing category safely
    revalidateCalls = [];
    const clearCategoryRes = await actions.updateProductAction("prod-s25", {
      category_id: null,
    });
    assert.equal(clearCategoryRes.success, true);
    assertRevalidatedBothLocales("/categories/chargers-cables");
    assert.equal(
      revalidateCalls.some((c) => c.path.includes("null") || c.path.includes("undefined")),
      false
    );

    // Toggle product active revalidates product + its category in both locales
    revalidateCalls = [];
    const toggleRes = await actions.toggleProductActiveAction("prod-pixel", true);
    assert.equal(toggleRes.success, true);
    assertRevalidatedBothLocales("/");
    assertRevalidatedBothLocales("/shop");
    assertRevalidatedBothLocales("/products/pixel-10-pro");
    assertRevalidatedBothLocales("/categories/smartphones");

    // Delete product revalidates product + its category in both locales
    revalidateCalls = [];
    const deleteRes = await actions.deleteProductAction("prod-pixel");
    assert.equal(deleteRes.success, true);
    assertRevalidatedBothLocales("/");
    assertRevalidatedBothLocales("/shop");
    assertRevalidatedBothLocales("/products/pixel-10-pro");
    assertRevalidatedBothLocales("/categories/smartphones");
  });

  it("brand actions (create, update, delete, toggle) revalidate both /en and /ar", async () => {
    const actions = loadModuleWithMocks<typeof AdminActionsMod>("src/app/actions/admin.ts");

    for (const fn of [
      () => actions.createBrandAction({ name: "Apple", slug: "apple" }),
      () => actions.updateBrandAction("brand-samsung", { name: "Samsung Qatar" }),
      () => actions.toggleBrandActiveAction("brand-samsung", true),
      () => actions.deleteBrandAction("brand-samsung"),
    ]) {
      revalidateCalls = [];
      const res = await fn();
      assert.equal(res.success, true);
      assertRevalidatedBothLocales("/");
      assertRevalidatedBothLocales("/shop");
    }
  });

  it("category actions (create, update including slug change, delete) revalidate old & new category routes in both locales", async () => {
    const actions = loadModuleWithMocks<typeof AdminActionsMod>("src/app/actions/admin.ts");

    revalidateCalls = [];
    const createRes = await actions.createCategoryAction({ name: "Tablets", slug: "tablets" });
    assert.equal(createRes.success, true);
    assertRevalidatedBothLocales("/");
    assertRevalidatedBothLocales("/shop");
    assertRevalidatedBothLocales("/categories");
    assertRevalidatedBothLocales("/categories/tablets");

    revalidateCalls = [];
    const updateSlugRes = await actions.updateCategoryAction("cat-smartphones", {
      name: "Phones Qatar",
      slug: "phones-qatar",
    });
    assert.equal(updateSlugRes.success, true);
    assertRevalidatedBothLocales("/");
    assertRevalidatedBothLocales("/shop");
    assertRevalidatedBothLocales("/categories/smartphones");
    assertRevalidatedBothLocales("/categories/phones-qatar");

    revalidateCalls = [];
    const deleteRes = await actions.deleteCategoryAction("cat-smartphones");
    assert.equal(deleteRes.success, true);
    assertRevalidatedBothLocales("/");
    assertRevalidatedBothLocales("/categories/phones-qatar");
  });

  it("banner, site settings, and seedInitialDataAction revalidate expected dual-locale paths; order actions leave storefront clean", async () => {
    const actions = loadModuleWithMocks<typeof AdminActionsMod>("src/app/actions/admin.ts");

    for (const fn of [
      () => actions.createBannerAction({ desktop_image_url: "https://cdn.example.com/b.jpg" }),
      () => actions.updateBannerAction("banner-1", { title: "Updated" }),
      () => actions.deleteBannerAction("banner-1"),
    ]) {
      revalidateCalls = [];
      const res = await fn();
      assert.equal(res.success, true);
      assertRevalidatedBothLocales("/");
    }

    revalidateCalls = [];
    const settingsRes = await actions.updateSiteSettingsAction({
      store_name: "Mobile Deals",
      whatsapp_number: "+97450000000",
    });
    assert.equal(settingsRes.success, true);
    assertRevalidatedBothLocales("/");
    assertRevalidatedBothLocales("/shop");
    assertRevalidatedBothLocales("/checkout");
    assertRevalidatedBothLocales("/cart");

    revalidateCalls = [];
    const seedRes = await actions.seedInitialDataAction();
    assert.equal(seedRes.success, true);
    assertRevalidatedBothLocales("/");
    assertRevalidatedBothLocales("/shop");
    assert.ok(revalidateCalls.some((c) => c.path === "/admin"));

    // Order actions must revalidate admin order paths only and NEVER invalidate storefront routes
    revalidateCalls = [];
    const orderStatusRes = await actions.updateOrderStatusAction("order-1", "confirmed");
    assert.equal(orderStatusRes.success, true);
    assert.ok(revalidateCalls.some((c) => c.path === "/admin/orders/order-1"));
    assert.equal(
      revalidateCalls.some((c) => c.path.startsWith("/en") || c.path.startsWith("/ar") || c.path === "/"),
      false,
      "updateOrderStatusAction must not revalidate storefront paths"
    );

    revalidateCalls = [];
    const deleteOrderRes = await actions.deleteOrderAction("order-1");
    assert.equal(deleteOrderRes.success, true);
    assert.ok(revalidateCalls.some((c) => c.path === "/admin/orders"));
    assert.equal(
      revalidateCalls.some((c) => c.path.startsWith("/en") || c.path.startsWith("/ar") || c.path === "/"),
      false,
      "deleteOrderAction must not revalidate storefront paths"
    );
  });

  it("unauthorized admin session blocks mutation and triggers zero revalidations", async () => {
    mockAdminSession = null;
    const actions = loadModuleWithMocks<typeof AdminActionsMod>("src/app/actions/admin.ts");

    const res = await actions.createProductAction({
      name: "Blocked",
      slug: "blocked",
      price: 100,
    });
    assert.equal(res.success, false);
    assert.equal(revalidateCalls.length, 0);
  });
});
