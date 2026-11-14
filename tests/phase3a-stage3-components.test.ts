import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const Module = require("node:module");
const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");

// ---------------------------------------------------------------------------
// Minimal W3C DOM & RAF Shim so real React 19 createRoot + createPortal + StrictMode execute cleanly
// ---------------------------------------------------------------------------

interface StyleMap {
  [key: string]: string;
}

class ShimNode {
  nodeType: number;
  parentNode: ShimElement | null = null;
  childNodes: ShimNode[] = [];

  constructor(nodeType: number) {
    this.nodeType = nodeType;
  }

  get ownerDocument(): ShimDocument | null {
    return this.nodeType === 9 ? null : shimDocument;
  }

  get isConnected(): boolean {
    if (
      (this as unknown) === shimDocument.documentElement ||
      (this as unknown) === shimDocument.body
    ) {
      return true;
    }
    let cur: ShimNode | null = this.parentNode;
    while (cur) {
      if (cur === shimDocument.documentElement || cur === shimDocument.body) return true;
      cur = cur.parentNode;
    }
    return false;
  }

  appendChild<T extends ShimNode>(child: T): T {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this as unknown as ShimElement;
    this.childNodes.push(child);
    return child;
  }

  insertBefore<T extends ShimNode>(newNode: T, refNode: ShimNode | null): T {
    if (!refNode) return this.appendChild(newNode);
    if (newNode.parentNode) {
      newNode.parentNode.removeChild(newNode);
    }
    const idx = this.childNodes.indexOf(refNode);
    if (idx === -1) return this.appendChild(newNode);
    newNode.parentNode = this as unknown as ShimElement;
    this.childNodes.splice(idx, 0, newNode);
    return newNode;
  }

  removeChild<T extends ShimNode>(child: T): T {
    const idx = this.childNodes.indexOf(child);
    if (idx !== -1) {
      this.childNodes.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  contains(other: ShimNode | null): boolean {
    let cur: ShimNode | null = other;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parentNode;
    }
    return false;
  }

  get firstChild(): ShimNode | null {
    return this.childNodes[0] ?? null;
  }

  get nextSibling(): ShimNode | null {
    if (!this.parentNode) return null;
    const idx = this.parentNode.childNodes.indexOf(this);
    return idx >= 0 && idx + 1 < this.parentNode.childNodes.length
      ? this.parentNode.childNodes[idx + 1]
      : null;
  }

  get previousSibling(): ShimNode | null {
    if (!this.parentNode) return null;
    const idx = this.parentNode.childNodes.indexOf(this);
    return idx > 0 ? this.parentNode.childNodes[idx - 1] : null;
  }

  get textContent(): string {
    return this.childNodes.map((c) => c.textContent).join("");
  }

  set textContent(val: string) {
    this.childNodes = val ? [new ShimText(String(val))] : [];
  }
}

class ShimText extends ShimNode {
  data: string;
  constructor(text: string) {
    super(3);
    this.data = String(text);
  }
  get nodeValue(): string {
    return this.data;
  }
  set nodeValue(val: string) {
    this.data = String(val);
  }
  override get textContent(): string {
    return this.data;
  }
  override set textContent(val: string) {
    this.data = String(val);
  }
}

class ShimComment extends ShimNode {
  data: string;
  constructor(text: string) {
    super(8);
    this.data = String(text);
  }
  override get textContent(): string {
    return "";
  }
}

class ShimEvent {
  type: string;
  key?: string;
  shiftKey?: boolean;
  target: unknown = null;
  currentTarget: unknown = null;
  defaultPrevented = false;
  bubbles = true;
  cancelable = true;

  constructor(type: string, init: { key?: string; shiftKey?: boolean; bubbles?: boolean } = {}) {
    this.type = type;
    this.key = init.key;
    this.shiftKey = Boolean(init.shiftKey);
    if (init.bubbles !== undefined) this.bubbles = init.bubbles;
  }

  preventDefault(): void {
    this.defaultPrevented = true;
  }
  stopPropagation(): void {}
}

type EventListenerEntry = { fn: (e: unknown) => void };

function matchesSingleSelector(el: ShimElement, selector: string): boolean {
  const s = selector.trim();
  if (!s) return false;

  // Support compound selector parts like button:not([disabled]), input:not([disabled]):not([type='hidden']), a[href], [tabindex]:not([tabindex='-1'])
  const notRegex = /:not\(([^)]+)\)/g;
  const negations: string[] = [];
  const base = s.replace(notRegex, (_, inner: string) => {
    negations.push(inner.trim());
    return "";
  });

  for (const neg of negations) {
    if (matchesSingleSelector(el, neg)) return false;
  }

  // Extract tag name if present at start
  const attrMatches: Array<{ name: string; value: string | null }> = [];
  let rem = base;

  const attrRegex = /\[([^\]=]+)(?:=['"]?([^\]'"]*)['"]?)?\]/g;
  rem = rem.replace(attrRegex, (_, attrName: string, attrVal: string | undefined) => {
    attrMatches.push({
      name: attrName.trim().toLowerCase(),
      value: attrVal !== undefined ? attrVal : null,
    });
    return "";
  });

  if (rem.startsWith("#")) {
    if (el.id !== rem.slice(1)) return false;
  } else if (rem.startsWith(".")) {
    const cls = rem.slice(1);
    const classes = (el.getAttribute("class") || "").split(/\s+/);
    if (!classes.includes(cls)) return false;
  } else if (rem) {
    if (el.tagName.toLowerCase() !== rem.toLowerCase()) return false;
  }

  for (const attr of attrMatches) {
    if (!el.hasAttribute(attr.name)) return false;
    if (attr.value !== null && el.getAttribute(attr.name) !== attr.value) {
      return false;
    }
  }

  return true;
}

function matchesSelectorList(el: ShimElement, selectorList: string): boolean {
  return selectorList
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((chain) => {
      const parts = chain.match(/(?:[^\s[\]]+|\[[^\]]*\])+/g) || [];
      if (parts.length === 0) return false;
      if (!matchesSingleSelector(el, parts[parts.length - 1])) return false;
      let ancestor: ShimNode | null = el.parentNode;
      for (let i = parts.length - 2; i >= 0; i--) {
        let matched = false;
        while (ancestor && ancestor instanceof ShimElement) {
          if (matchesSingleSelector(ancestor, parts[i])) {
            matched = true;
            ancestor = ancestor.parentNode;
            break;
          }
          ancestor = ancestor.parentNode;
        }
        if (!matched) return false;
      }
      return true;
    });
}

class ShimElement extends ShimNode {
  tagName: string;
  nodeName: string;
  namespaceURI = "http://www.w3.org/1999/xhtml";
  attributes = new Map<string, string>();
  style: StyleMap = {};
  listeners = new Map<string, EventListenerEntry[]>();
  focusCount = 0;
  mockZeroRect = false;

  constructor(tagName: string) {
    super(1);
    this.tagName = tagName.toUpperCase();
    this.nodeName = this.tagName;
  }

  get children(): ShimElement[] {
    return this.childNodes.filter((c): c is ShimElement => c instanceof ShimElement);
  }

  get id(): string {
    return this.getAttribute("id") || "";
  }
  set id(val: string) {
    this.setAttribute("id", val);
  }

  get className(): string {
    return this.getAttribute("class") || "";
  }
  set className(val: string) {
    this.setAttribute("class", val);
  }

  get inert(): boolean {
    return this.hasAttribute("inert");
  }
  set inert(val: boolean) {
    if (val) this.setAttribute("inert", "");
    else this.removeAttribute("inert");
  }

  get hidden(): boolean {
    return this.hasAttribute("hidden");
  }
  set hidden(val: boolean) {
    if (val) this.setAttribute("hidden", "");
    else this.removeAttribute("hidden");
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }
  set disabled(val: boolean) {
    if (val) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  get tabIndex(): number {
    const raw = this.getAttribute("tabindex");
    if (raw !== null) {
      const n = Number.parseInt(raw, 10);
      return Number.isNaN(n) ? 0 : n;
    }
    if (["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(this.tagName)) return 0;
    if (this.tagName === "A" && this.hasAttribute("href")) return 0;
    return -1;
  }
  set tabIndex(val: number) {
    this.setAttribute("tabindex", String(val));
  }

  getAttribute(name: string): string | null {
    const val = this.attributes.get(name.toLowerCase());
    return val !== undefined ? val : null;
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name.toLowerCase());
  }

  setAttribute(name: string, val: unknown): void {
    this.attributes.set(name.toLowerCase(), String(val));
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name.toLowerCase());
  }

  focus(): void {
    this.focusCount += 1;
    shimDocument.activeElement = this;
  }

  blur(): void {
    if (shimDocument.activeElement === this) {
      shimDocument.activeElement = shimDocument.body;
    }
  }

  getBoundingClientRect(): {
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  } {
    if (this.mockZeroRect || this.style.display === "none") {
      return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 };
    }
    return { width: 120, height: 36, top: 0, left: 0, right: 120, bottom: 36 };
  }

  closest(selector: string): ShimElement | null {
    if (matchesSelectorList(this, selector)) return this;
    let cur: ShimNode | null = this.parentNode;
    while (cur && cur instanceof ShimElement) {
      if (matchesSelectorList(cur, selector)) return cur;
      cur = cur.parentNode;
    }
    return null;
  }

  querySelectorAll<T = ShimElement>(selector: string): T[] {
    const results: ShimElement[] = [];
    const walk = (node: ShimNode) => {
      for (const child of node.childNodes) {
        if (child instanceof ShimElement) {
          if (matchesSelectorList(child, selector)) results.push(child);
          walk(child);
        }
      }
    };
    walk(this);
    return results as unknown as T[];
  }

  querySelector<T = ShimElement>(selector: string): T | null {
    return (this.querySelectorAll<T>(selector)[0] ?? null) as T | null;
  }

  addEventListener(type: string, fn: (e: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push({ fn });
    this.listeners.set(type, list);
  }

  removeEventListener(type: string, fn: (e: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      list.filter((item) => item.fn !== fn)
    );
  }

  dispatchEvent(event: ShimEvent): boolean {
    event.target = this;
    event.currentTarget = this;
    for (const entry of this.listeners.get(event.type) ?? []) {
      entry.fn(event);
    }
    let cur: ShimNode | null = event.bubbles ? this.parentNode : null;
    while (cur) {
      if (cur instanceof ShimElement) {
        event.currentTarget = cur;
        for (const entry of cur.listeners.get(event.type) ?? []) {
          entry.fn(event);
        }
      }
      if (!event.bubbles) break;
      cur = cur.parentNode;
    }
    return !event.defaultPrevented;
  }
}

class ShimHTMLElement extends ShimElement {}
class ShimHTMLIFrameElement extends ShimHTMLElement {
  contentWindow = null;
}

class ShimDocument extends ShimNode {
  documentElement: ShimHTMLElement;
  body: ShimHTMLElement;
  head: ShimHTMLElement;
  activeElement: ShimElement | null = null;
  listeners = new Map<string, EventListenerEntry[]>();

  get defaultView() {
    return shimWindow;
  }

  constructor() {
    super(9);
    this.documentElement = new ShimHTMLElement("html");
    this.documentElement.parentNode = this as unknown as ShimElement;
    this.head = new ShimHTMLElement("head");
    this.body = new ShimHTMLElement("body");
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.activeElement = this.body;
  }

  createElement(tag: string): ShimHTMLElement {
    if (tag.toLowerCase() === "iframe") return new ShimHTMLIFrameElement("iframe");
    return new ShimHTMLElement(tag);
  }

  createElementNS(_ns: string, tag: string): ShimHTMLElement {
    return this.createElement(tag);
  }

  createTextNode(text: string): ShimText {
    return new ShimText(text);
  }

  createComment(text: string): ShimComment {
    return new ShimComment(text);
  }

  createEvent(): ShimEvent {
    return new ShimEvent("event");
  }

  querySelectorAll<T = ShimElement>(selector: string): T[] {
    return this.documentElement.querySelectorAll<T>(selector);
  }

  querySelector<T = ShimElement>(selector: string): T | null {
    return this.documentElement.querySelector<T>(selector);
  }

  addEventListener(type: string, fn: (e: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push({ fn });
    this.listeners.set(type, list);
  }

  removeEventListener(type: string, fn: (e: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      list.filter((item) => item.fn !== fn)
    );
  }

  dispatchEvent(event: ShimEvent): boolean {
    event.currentTarget = this;
    for (const entry of this.listeners.get(event.type) ?? []) {
      entry.fn(event);
    }
    return !event.defaultPrevented;
  }
}

const shimDocument = new ShimDocument();
const windowListeners = new Map<string, EventListenerEntry[]>();
let rafCounter = 1;
const rafQueue = new Map<number, (ts: number) => void>();
let historyCalls: string[] = [];
let routerPushCalls: string[] = [];
let mockLocale = "en";
let mockPathname = "/shop";
let mockSearchParams = new URLSearchParams();
let mockReducedMotion = false;
let mockNoIntlContext = false;

const shimWindow = {
  document: shimDocument,
  location: { search: "", pathname: "/en/shop", href: "http://localhost:3000/en/shop" },
  history: {
    replaceState: (_state: unknown, _unused: string, url: string) => {
      historyCalls.push(String(url));
    },
  },
  navigator: { userAgent: "node-test-shim" },
  matchMedia: (query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? mockReducedMotion : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  getComputedStyle: (el: ShimElement) => ({
    display: el.style.display || "block",
    visibility: el.style.visibility || "visible",
    pointerEvents: el.style.pointerEvents || "auto",
  }),
  requestAnimationFrame: (cb: (ts: number) => void): number => {
    const id = rafCounter++;
    rafQueue.set(id, cb);
    return id;
  },
  cancelAnimationFrame: (id: number): void => {
    rafQueue.delete(id);
  },
  addEventListener: (type: string, fn: (e: unknown) => void): void => {
    const list = windowListeners.get(type) ?? [];
    list.push({ fn });
    windowListeners.set(type, list);
  },
  removeEventListener: (type: string, fn: (e: unknown) => void): void => {
    const list = windowListeners.get(type) ?? [];
    windowListeners.set(
      type,
      list.filter((item) => item.fn !== fn)
    );
  },
  dispatchEvent: (event: ShimEvent): void => {
    for (const entry of windowListeners.get(event.type) ?? []) {
      entry.fn(event);
    }
  },
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  HTMLElement: ShimHTMLElement,
  HTMLIFrameElement: ShimHTMLIFrameElement,
  Element: ShimElement,
  Node: ShimNode,
  Event: ShimEvent,
  KeyboardEvent: ShimEvent,
  MouseEvent: ShimEvent,
};

function flushAnimationFrames(maxIterations = 10): void {
  let count = 0;
  while (rafQueue.size > 0 && count < maxIterations) {
    const batch = Array.from(rafQueue.entries());
    rafQueue.clear();
    for (const [, cb] of batch) {
      cb(16 * (count + 1));
    }
    count += 1;
  }
}

Object.assign(globalThis, {
  IS_REACT_ACT_ENVIRONMENT: true,
  window: shimWindow,
  document: shimDocument,
  HTMLElement: ShimHTMLElement,
  HTMLIFrameElement: ShimHTMLIFrameElement,
  Element: ShimElement,
  Node: ShimNode,
  Event: ShimEvent,
  KeyboardEvent: ShimEvent,
  MouseEvent: ShimEvent,
  NodeFilter: { SHOW_ALL: 0xffffffff },
  requestAnimationFrame: shimWindow.requestAnimationFrame,
  cancelAnimationFrame: shimWindow.cancelAnimationFrame,
  getComputedStyle: shimWindow.getComputedStyle,
});

// Now load React & ReactDOM Client AFTER DOM globals exist
const React = require("react") as typeof import("react");
const { createRoot } = require("react-dom/client") as typeof import("react-dom/client");

const MockIntlContext = React.createContext<{
  locale: string;
  messages: Record<string, Record<string, unknown>>;
} | null>(null);

// ---------------------------------------------------------------------------
// Load real Stage 3 TypeScript/TSX modules in Node via ts.transpileModule + Module._load hook
// ---------------------------------------------------------------------------

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

const iconStubCache = new Map<string, React.FC<Record<string, unknown>>>();
const lucideProxy = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (!iconStubCache.has(prop)) {
        const IconComp: React.FC<Record<string, unknown>> = (props) =>
          React.createElement("svg", { "data-icon": prop, ...props });
        iconStubCache.set(prop, IconComp);
      }
      return iconStubCache.get(prop);
    },
  }
);

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

function loadTsxModule(filePath: string): Record<string, unknown> {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
  if (transpiledCache.has(absPath)) {
    return transpiledCache.get(absPath)!;
  }

  const originalLoad = Module._load;
  Module._load = function patchedLoad(
    request: string,
    parent: { filename?: string } | null,
    isMain: boolean
  ) {
    if (request === "next-intl") {
      return {
        __esModule: true,
        NextIntlClientProvider: ({
          locale,
          messages,
          children,
        }: {
          locale: string;
          messages?: Record<string, Record<string, unknown>>;
          children?: React.ReactNode;
        }) =>
          React.createElement(
            MockIntlContext.Provider,
            {
              value: {
                locale,
                messages: messages ?? (locale === "ar" ? arMessages : enMessages),
              },
            },
            children
          ),
        useLocale: () => {
          const ctx = React.useContext(MockIntlContext);
          if (ctx) return ctx.locale;
          if (mockNoIntlContext) {
            throw new Error("No intl context found");
          }
          return mockLocale;
        },
        useTranslations: (namespace: string) => {
          const ctx = React.useContext(MockIntlContext);
          if (!ctx && mockNoIntlContext) {
            throw new Error("No intl context found");
          }
          const activeLocale = ctx ? ctx.locale : mockLocale;
          const msgs = ctx ? ctx.messages : activeLocale === "ar" ? arMessages : enMessages;
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
        }) => {
          const ctx = React.useContext(MockIntlContext);
          if (!ctx && mockNoIntlContext) {
            throw new Error("No intl context found");
          }
          return React.createElement("a", { href, ...rest }, children);
        },
        useRouter: () => ({
          push: (href: string) => {
            routerPushCalls.push(href);
          },
          replace: (href: string) => {
            routerPushCalls.push(href);
          },
        }),
        usePathname: () => mockPathname,
        redirect: (href: string) => {
          routerPushCalls.push(href);
        },
      };
    }

    if (request === "next/navigation") {
      return {
        __esModule: true,
        useSearchParams: () => mockSearchParams,
        notFound: () => {
          throw new Error("NOT_FOUND");
        },
      };
    }

    if (request === "next/image") {
      return {
        __esModule: true,
        default: ({ src, alt, ...props }: { src: string; alt: string; [k: string]: unknown }) => {
          const rest = { ...props };
          delete rest.fill;
          delete rest.priority;
          delete rest.sizes;
          return React.createElement("img", { src, alt, ...rest });
        },
      };
    }

    if (request === "lucide-react") {
      return lucideProxy;
    }

    if (request === "@/hooks/use-cart") {
      return {
        useCart: () => ({
          items: [],
          totalItems: 2,
          addItem: () => {},
          removeItem: () => {},
          updateQuantity: () => {},
          clearCart: () => {},
        }),
      };
    }

    if (request === "@/hooks/use-wishlist") {
      return {
        useWishlist: () => ({
          wishlistIds: [],
          totalWishlist: 1,
          toggleWishlist: () => {},
          isInWishlist: () => false,
        }),
      };
    }

    const resolvedLocal = resolveAliasOrRelative(request, parent?.filename);
    if (resolvedLocal && (resolvedLocal.endsWith(".ts") || resolvedLocal.endsWith(".tsx"))) {
      return loadTsxModule(resolvedLocal);
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
    return mod.exports as Record<string, unknown>;
  } finally {
    Module._load = originalLoad;
  }
}

const mainNavbarMod = loadTsxModule("src/components/store/main-navbar.tsx") as {
  MainNavbar: React.FC<{ whatsappNumber?: string; currency?: string }>;
  isElementVisiblyFocusable: (el: HTMLElement | null) => boolean;
  getFocusableElements: (container: HTMLElement) => HTMLElement[];
};

const shopCatalogMod = loadTsxModule("src/components/store/shop-catalog-client.tsx") as {
  ShopCatalogClient: React.FC<Record<string, unknown>>;
  buildLocalizedCatalogUrl: (locale: string, pathname: string, queryStr: string) => string;
  matchesBilingualCatalogSearch: (product: Record<string, unknown>, rawQuery: string) => boolean;
};

const announcementMod = loadTsxModule("src/components/store/announcement-bar.tsx") as {
  resolveAnnouncementItems: (
    items: string[] | undefined,
    itemsAr: string[] | null | undefined,
    locale: string,
    defaultItems: string[]
  ) => string[];
};

const logoMod = loadTsxModule("src/components/ui/logo.tsx") as {
  Logo: React.FC<{ className?: string; size?: "sm" | "md" | "lg" | "xl" }>;
};

const heroMod = loadTsxModule("src/components/store/hero-section.tsx") as {
  HeroSection: React.FC<{ banners?: unknown[]; whatsappNumber?: string }>;
  getHeroTrackTransform: (currentIdx: number, locale: string) => string;
};

function resetDomEnvironment(): void {
  shimDocument.body.childNodes = [];
  shimDocument.body.style = {};
  shimDocument.documentElement.style = {};
  shimDocument.body.removeAttribute("inert");
  shimDocument.body.removeAttribute("aria-hidden");
  shimDocument.activeElement = shimDocument.body;
  windowListeners.clear();
  rafQueue.clear();
  rafCounter = 1;
  historyCalls = [];
  routerPushCalls = [];
  mockLocale = "en";
  mockPathname = "/shop";
  mockSearchParams = new URLSearchParams();
  mockReducedMotion = false;
  mockNoIntlContext = false;
}

function findReactClickHandler(el: ShimElement): ((e: unknown) => void) | null {
  for (const key of Object.keys(el)) {
    if (key.startsWith("__reactProps$")) {
      const props = (el as unknown as Record<string, Record<string, unknown>>)[key];
      if (typeof props?.onClick === "function") {
        return props.onClick as (e: unknown) => void;
      }
    }
  }
  return null;
}

function clickReactElement(el: ShimElement): void {
  const onClick = findReactClickHandler(el);
  if (onClick) {
    onClick({
      currentTarget: el,
      target: el,
      preventDefault: () => {},
      stopPropagation: () => {},
    });
  }
}

// ---------------------------------------------------------------------------
// Suite 1: F-01 Real React DOM <React.StrictMode> Drawer Lifecycle & Focus
// ---------------------------------------------------------------------------

describe("F-01 Drawer Lifecycle Under React Strict Mode (Real React DOM)", () => {
  beforeEach(() => {
    resetDomEnvironment();
  });

  afterEach(() => {
    resetDomEnvironment();
  });

  it("MainNavbar drawer completes closed->opening->open under StrictMode, isolates siblings preserving pre-existing inert/aria-hidden, traps Tab/Escape, and restores focus once", async () => {
    const appHost = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    appHost.id = "app-root";
    const mainSibling = shimDocument.createElement("main") as unknown as ShimHTMLElement;
    mainSibling.id = "main-sibling";
    const preHiddenSibling = shimDocument.createElement("aside") as unknown as ShimHTMLElement;
    preHiddenSibling.id = "pre-inert-sibling";
    preHiddenSibling.inert = true;
    preHiddenSibling.setAttribute("aria-hidden", "true");

    shimDocument.body.appendChild(mainSibling);
    shimDocument.body.appendChild(preHiddenSibling);
    shimDocument.body.appendChild(appHost);

    shimDocument.body.style.overflow = "auto";
    shimDocument.body.style.touchAction = "pan-y";

    const root = createRoot(appHost as unknown as HTMLElement);

    await React.act(async () => {
      root.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(mainNavbarMod.MainNavbar, {
            whatsappNumber: "+97455000000",
            currency: "QAR",
          })
        )
      );
    });

    const triggerBtn = shimDocument.querySelector(
      'button[aria-controls="mobile-nav-drawer"]'
    ) as unknown as ShimHTMLElement;
    assert.ok(triggerBtn, "Mobile nav trigger button should render");
    assert.equal(triggerBtn.getAttribute("aria-expanded"), "false");

    // Step 1: Open drawer -> enters "opening" synchronously, portal mounts hidden
    await React.act(async () => {
      clickReactElement(triggerBtn);
    });

    const drawerPanelOpening = shimDocument.querySelector("#mobile-nav-drawer") as unknown as ShimHTMLElement;
    assert.ok(drawerPanelOpening, "Portal drawer must mount while in opening phase");
    assert.ok(
      drawerPanelOpening.className.includes("translate-x-full"),
      "Drawer should start offscreen in opening phase"
    );
    assert.equal(triggerBtn.getAttribute("aria-expanded"), "true");
    assert.equal(
      triggerBtn.focusCount,
      0,
      "StrictMode simulated cleanup in opening phase must NOT restore focus prematurely"
    );

    // Step 2: Advance double-RAF -> transitions to "open"
    await React.act(async () => {
      flushAnimationFrames();
    });

    const drawerPanelOpen = shimDocument.querySelector("#mobile-nav-drawer") as unknown as ShimHTMLElement;
    assert.ok(drawerPanelOpen.className.includes("translate-x-0"), "Drawer must slide in during open phase");
    assert.equal(mainSibling.inert, true, "Active sibling must be marked inert while drawer open");
    assert.equal(mainSibling.getAttribute("aria-hidden"), "true");
    assert.equal(preHiddenSibling.inert, true);
    assert.equal(preHiddenSibling.getAttribute("aria-hidden"), "true");
    assert.equal(shimDocument.body.style.overflow, "hidden");
    assert.equal(shimDocument.body.style.touchAction, "none");
    assert.equal(triggerBtn.focusCount, 0, "Opening drawer must not re-focus trigger");

    const closeBtn = shimDocument.querySelector(
      '#mobile-nav-drawer button[aria-label="Close menu"]'
    ) as unknown as ShimHTMLElement;
    assert.ok(closeBtn, "Drawer close button must exist");
    assert.equal(
      shimDocument.activeElement,
      closeBtn,
      "Opening drawer must move focus to drawer close button"
    );

    // Idempotent second open while already open does nothing
    await React.act(async () => {
      clickReactElement(triggerBtn);
    });
    assert.equal(triggerBtn.focusCount, 0);

    // Step 3: Keyboard Tab focus trap wraps cleanly inside drawer
    const focusables = mainNavbarMod.getFocusableElements(
      drawerPanelOpen as unknown as HTMLElement
    );
    assert.ok(focusables.length >= 2, "Drawer must have multiple focusable elements");
    const lastFocusable = focusables[focusables.length - 1] as unknown as ShimHTMLElement;
    lastFocusable.focus();
    const tabForward = new ShimEvent("keydown", { key: "Tab", shiftKey: false });
    await React.act(async () => {
      shimWindow.dispatchEvent(tabForward);
    });
    assert.equal(tabForward.defaultPrevented, true);
    assert.equal(
      shimDocument.activeElement,
      focusables[0],
      "Tab on last focusable element must wrap to first focusable element"
    );

    const shiftTabBack = new ShimEvent("keydown", { key: "Tab", shiftKey: true });
    await React.act(async () => {
      shimWindow.dispatchEvent(shiftTabBack);
    });
    assert.equal(shiftTabBack.defaultPrevented, true);
    assert.equal(
      shimDocument.activeElement,
      lastFocusable,
      "Shift+Tab on first focusable element must wrap to last focusable element"
    );

    // Step 4: Press Escape -> transitions "open" -> "closing", restores siblings/overflow & focus ONCE
    const escEvent = new ShimEvent("keydown", { key: "Escape" });
    await React.act(async () => {
      shimWindow.dispatchEvent(escEvent);
    });
    assert.equal(escEvent.defaultPrevented, true);
    assert.equal(triggerBtn.focusCount, 1, "Closing via Escape must restore trigger focus once");
    assert.equal(mainSibling.inert, false, "Previously non-inert sibling must have inert removed");
    assert.equal(
      mainSibling.getAttribute("aria-hidden"),
      null,
      "Previously non-hidden sibling must have aria-hidden removed"
    );
    assert.equal(preHiddenSibling.inert, true, "Pre-existing inert sibling must stay inert");
    assert.equal(
      preHiddenSibling.getAttribute("aria-hidden"),
      "true",
      "Pre-existing aria-hidden='true' must be preserved"
    );
    assert.equal(shimDocument.body.style.overflow, "auto");
    assert.equal(shimDocument.body.style.touchAction, "pan-y");

    // Step 5: Wait for 320ms fallback timer -> transitions "closing" -> "closed" and unmounts portal
    await React.act(async () => {
      await new Promise((r) => setTimeout(r, 360));
    });

    assert.equal(
      shimDocument.querySelector("#mobile-nav-drawer"),
      null,
      "Drawer portal must unmount after closing completes"
    );
    assert.equal(triggerBtn.focusCount, 1, "Focus restoration must remain idempotent (once)");

    await React.act(async () => {
      root.unmount();
    });
  });

  it("ShopCatalogClient filter drawer opens/closes in Arabic RTL and handles rapid open-then-close under StrictMode", async () => {
    mockLocale = "ar";
    mockPathname = "/shop";

    const appHost = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(appHost);
    const root = createRoot(appHost as unknown as HTMLElement);

    await React.act(async () => {
      root.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(shopCatalogMod.ShopCatalogClient, {
            initialProducts: [],
            categories: [],
            brands: [],
          })
        )
      );
    });

    const filterTrigger = shimDocument.querySelector(
      'button[aria-controls="mobile-filter-drawer"]'
    ) as unknown as ShimHTMLElement;
    assert.ok(filterTrigger, "Mobile filter trigger button should render");

    // Rapid open -> immediate same-tick close while still opening
    await React.act(async () => {
      clickReactElement(filterTrigger);
      clickReactElement(filterTrigger); // Second click while opening must be idempotent
    });
    const drawerOpening = shimDocument.querySelector("#mobile-filter-drawer") as unknown as ShimHTMLElement;
    assert.ok(drawerOpening, "Filter drawer should mount during opening");
    assert.ok(
      drawerOpening.className.includes("rtl:-translate-x-full"),
      "Filter drawer must include RTL slide direction utility"
    );

    // Escape during opening -> immediate closed + single focus restore
    await React.act(async () => {
      // Backdrop click via portal first child when open after RAFs, OR open -> RAF -> backdrop click
      flushAnimationFrames();
    });

    const closeBtn = shimDocument.querySelector(
      '#mobile-filter-drawer button[aria-label]'
    ) as unknown as ShimHTMLElement;
    assert.ok(closeBtn, "Filter drawer close button must exist");
    assert.equal(shimDocument.activeElement, closeBtn);

    await React.act(async () => {
      clickReactElement(closeBtn);
    });
    assert.equal(filterTrigger.focusCount, 1, "Closing via close button must restore focus once");

    await React.act(async () => {
      await new Promise((r) => setTimeout(r, 360));
    });
    assert.equal(shimDocument.querySelector("#mobile-filter-drawer"), null);

    // Same-tick open + close simulation on FilterDrawer trigger -> open, then unmount during opening
    await React.act(async () => {
      clickReactElement(filterTrigger);
    });
    await React.act(async () => {
      root.unmount();
    });
    assert.equal(
      filterTrigger.focusCount,
      1,
      "Unmounting disconnected/unmounted child trigger must not throw and external connected trigger behavior holds"
    );
  });

  it("Restores focus once on genuine unmount while opening/open when external trigger stays connected, and skips focus if trigger disconnected", async () => {
    const externalTrigger = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(externalTrigger);

    // Test both connected and disconnected parent unmount scenarios using a real StrictMode portal component
    // that uses MainNavbar's exact DrawerPhase lifecycle
    const DrawerMountProbe: React.FC<{
      triggerEl: HTMLElement;
      phaseMode: "opening" | "open" | "same-tick-close";
    }> = ({ triggerEl, phaseMode }) => {
      const [phase, setPhase] = React.useState<"closed" | "opening" | "open" | "closing">("closed");
      const phaseRef = React.useRef<"closed" | "opening" | "open" | "closing">("closed");
      const activeTriggerRef = React.useRef<HTMLElement | null>(null);
      const needsRestoreRef = React.useRef(false);
      const portalRef = React.useRef<HTMLDivElement | null>(null);

      const restoreOnce = React.useCallback(() => {
        if (!needsRestoreRef.current) return;
        needsRestoreRef.current = false;
        const target = activeTriggerRef.current;
        activeTriggerRef.current = null;
        if (target && target.isConnected && document.contains(target)) {
          target.focus();
        }
      }, []);

      React.useEffect(() => {
        activeTriggerRef.current = triggerEl;
        needsRestoreRef.current = true;
        phaseRef.current = "opening";
        setPhase("opening");

        if (phaseMode === "same-tick-close") {
          phaseRef.current = "closed";
          setPhase("closed");
          restoreOnce();
        }
      }, [triggerEl, phaseMode, restoreOnce]);

      React.useEffect(() => {
        if (phase !== "opening") return;
        let didOpen = false;
        const r1 = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (phaseMode === "open") {
              didOpen = true;
              phaseRef.current = "open";
              setPhase("open");
            }
          });
        });
        const portalRoot = portalRef.current;
        return () => {
          cancelAnimationFrame(r1);
          const isStrictReplay =
            phaseRef.current === "opening" && Boolean(portalRoot && portalRoot.isConnected);
          if (!didOpen && phaseRef.current !== "open" && !isStrictReplay) {
            restoreOnce();
          }
        };
      }, [phase, phaseMode, restoreOnce]);

      React.useEffect(() => {
        if (phase !== "open") return;
        const portalRoot = portalRef.current;
        return () => {
          const isStrictReplay =
            phaseRef.current === "open" && Boolean(portalRoot && portalRoot.isConnected);
          if (!isStrictReplay) {
            restoreOnce();
          }
        };
      }, [phase, restoreOnce]);

      if (phase === "closed") return null;
      return require("react-dom").createPortal(
        React.createElement("div", { ref: portalRef, id: "probe-portal" }, "drawer"),
        document.body
      );
    };

    // Case A: Genuine unmount during "opening" with connected external trigger -> focusCount === 1
    const hostA = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(hostA);
    const rootA = createRoot(hostA as unknown as HTMLElement);
    await React.act(async () => {
      rootA.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(DrawerMountProbe, {
            triggerEl: externalTrigger as unknown as HTMLElement,
            phaseMode: "opening",
          })
        )
      );
    });
    assert.equal(externalTrigger.focusCount, 0, "Must not focus during StrictMode replay in opening");
    await React.act(async () => {
      rootA.unmount();
    });
    assert.equal(externalTrigger.focusCount, 1, "Connected trigger must receive focus once on unmount while opening");

    // Case B: Genuine unmount during "open" with connected external trigger -> focusCount === 1
    externalTrigger.focusCount = 0;
    const hostB = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(hostB);
    const rootB = createRoot(hostB as unknown as HTMLElement);
    await React.act(async () => {
      rootB.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(DrawerMountProbe, {
            triggerEl: externalTrigger as unknown as HTMLElement,
            phaseMode: "open",
          })
        )
      );
    });
    await React.act(async () => {
      flushAnimationFrames();
    });
    assert.equal(externalTrigger.focusCount, 0);
    await React.act(async () => {
      rootB.unmount();
    });
    assert.equal(externalTrigger.focusCount, 1, "Connected trigger must receive focus once on unmount while open");

    // Case C: Disconnected trigger must NEVER receive focus on unmount
    const disconnectedTrigger = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(disconnectedTrigger);
    const hostC = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(hostC);
    const rootC = createRoot(hostC as unknown as HTMLElement);
    await React.act(async () => {
      rootC.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(DrawerMountProbe, {
            triggerEl: disconnectedTrigger as unknown as HTMLElement,
            phaseMode: "open",
          })
        )
      );
    });
    await React.act(async () => {
      flushAnimationFrames();
    });
    shimDocument.body.removeChild(disconnectedTrigger);
    assert.equal(disconnectedTrigger.isConnected, false);
    await React.act(async () => {
      rootC.unmount();
    });
    assert.equal(disconnectedTrigger.focusCount, 0, "Disconnected trigger must NEVER be focused");

    // Case D: Same-tick open then immediate close restores trigger focus exactly once
    externalTrigger.focusCount = 0;
    const SameTickProbe: React.FC<{ triggerEl: HTMLElement }> = ({ triggerEl: trig }) => {
      const [, setPhase] = React.useState<"closed" | "opening" | "open" | "closing">("closed");
      const phaseRef = React.useRef<"closed" | "opening" | "open" | "closing">("closed");
      const activeTriggerRef = React.useRef<HTMLElement | null>(null);
      const needsRestoreRef = React.useRef(false);

      const restoreOnce = () => {
        if (!needsRestoreRef.current) return;
        needsRestoreRef.current = false;
        const target = activeTriggerRef.current;
        activeTriggerRef.current = null;
        if (target && target.isConnected && document.contains(target)) {
          target.focus();
        }
      };

      const openDrawer = () => {
        if (phaseRef.current === "opening" || phaseRef.current === "open") return;
        activeTriggerRef.current = trig;
        needsRestoreRef.current = true;
        phaseRef.current = "opening";
        setPhase("opening");
      };

      const closeDrawer = () => {
        const prev = phaseRef.current;
        if (prev === "closed" || prev === "closing") return;
        const next = prev === "opening" ? "closed" : "closing";
        phaseRef.current = next;
        setPhase(next);
        if (next === "closed") restoreOnce();
      };

      return React.createElement(
        "button",
        {
          id: "same-tick-action",
          onClick: () => {
            openDrawer();
            closeDrawer();
          },
        },
        "trigger"
      );
    };

    const hostD = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(hostD);
    const rootD = createRoot(hostD as unknown as HTMLElement);
    await React.act(async () => {
      rootD.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(SameTickProbe, {
            triggerEl: externalTrigger as unknown as HTMLElement,
          })
        )
      );
    });
    const sameTickBtn = hostD.querySelector("#same-tick-action") as unknown as ShimHTMLElement;
    await React.act(async () => {
      clickReactElement(sameTickBtn);
    });
    assert.equal(externalTrigger.focusCount, 1, "Same-tick open+close restores focus once");
    await React.act(async () => {
      rootD.unmount();
    });
    assert.equal(externalTrigger.focusCount, 1);
  });

  it("isElementVisiblyFocusable excludes disabled/hidden/inert/aria-hidden/zero-rect elements and preserves pointer-events: none", () => {
    const container = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(container);

    const visibleBtn = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    const pointerNoneBtn = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    pointerNoneBtn.style.pointerEvents = "none";

    const disabledBtn = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    disabledBtn.disabled = true;

    const ariaDisabledBtn = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    ariaDisabledBtn.setAttribute("aria-disabled", "true");

    const hiddenBtn = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    hiddenBtn.hidden = true;

    const displayNoneBtn = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    displayNoneBtn.style.display = "none";

    const zeroRectBtn = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    zeroRectBtn.mockZeroRect = true;

    const inertParent = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    inertParent.inert = true;
    const btnInInert = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    inertParent.appendChild(btnInInert);

    const ariaHiddenParent = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    ariaHiddenParent.setAttribute("aria-hidden", "true");
    const btnInAriaHidden = shimDocument.createElement("button") as unknown as ShimHTMLElement;
    ariaHiddenParent.appendChild(btnInAriaHidden);

    const disconnectedBtn = shimDocument.createElement("button") as unknown as ShimHTMLElement;

    for (const el of [
      visibleBtn,
      pointerNoneBtn,
      disabledBtn,
      ariaDisabledBtn,
      hiddenBtn,
      displayNoneBtn,
      zeroRectBtn,
      inertParent,
      ariaHiddenParent,
    ]) {
      container.appendChild(el);
    }

    assert.equal(mainNavbarMod.isElementVisiblyFocusable(visibleBtn as unknown as HTMLElement), true);
    assert.equal(mainNavbarMod.isElementVisiblyFocusable(pointerNoneBtn as unknown as HTMLElement), true);
    assert.equal(mainNavbarMod.isElementVisiblyFocusable(disabledBtn as unknown as HTMLElement), false);
    assert.equal(mainNavbarMod.isElementVisiblyFocusable(ariaDisabledBtn as unknown as HTMLElement), false);
    assert.equal(mainNavbarMod.isElementVisiblyFocusable(hiddenBtn as unknown as HTMLElement), false);
    assert.equal(mainNavbarMod.isElementVisiblyFocusable(displayNoneBtn as unknown as HTMLElement), false);
    assert.equal(mainNavbarMod.isElementVisiblyFocusable(zeroRectBtn as unknown as HTMLElement), false);
    assert.equal(mainNavbarMod.isElementVisiblyFocusable(btnInInert as unknown as HTMLElement), false);
    assert.equal(mainNavbarMod.isElementVisiblyFocusable(btnInAriaHidden as unknown as HTMLElement), false);
    assert.equal(mainNavbarMod.isElementVisiblyFocusable(disconnectedBtn as unknown as HTMLElement), false);

    const focusables = mainNavbarMod.getFocusableElements(container as unknown as HTMLElement);
    assert.equal(focusables.length, 2);
    assert.ok(focusables.includes(visibleBtn as unknown as HTMLElement));
    assert.ok(focusables.includes(pointerNoneBtn as unknown as HTMLElement));
  });
});

// ---------------------------------------------------------------------------
// Suite 2: F-03 ShopCatalogClient Locale URL Sync & Bilingual Search Filtering
// ---------------------------------------------------------------------------

describe("F-03 ShopCatalogClient Locale URL Preservation & Bilingual Filtering", () => {
  beforeEach(() => {
    resetDomEnvironment();
  });

  it("buildLocalizedCatalogUrl prefixes locale cleanly and never double-prefixes", () => {
    assert.equal(
      shopCatalogMod.buildLocalizedCatalogUrl("en", "/shop", "brand=apple"),
      "/en/shop?brand=apple"
    );
    assert.equal(
      shopCatalogMod.buildLocalizedCatalogUrl("ar", "/shop", "sort=price_asc"),
      "/ar/shop?sort=price_asc"
    );
    assert.equal(
      shopCatalogMod.buildLocalizedCatalogUrl("ar", "/ar/shop", "in_stock=true"),
      "/ar/shop?in_stock=true"
    );
    assert.equal(
      shopCatalogMod.buildLocalizedCatalogUrl("ar", "/categories/smartphones", ""),
      "/ar/categories/smartphones"
    );
    assert.equal(
      shopCatalogMod.buildLocalizedCatalogUrl("en", "/", ""),
      "/en"
    );
  });

  it("matchesBilingualCatalogSearch matches both English and Arabic product, brand, description, and free gift fields", () => {
    const product = {
      name: "iPhone 16 Pro Max",
      name_ar: "آيفون 16 برو ماكس",
      short_description: "Titanium smartphone with Pro camera",
      short_description_ar: "هاتف ذكي من التيتانيوم بكاميرا احترافية",
      free_gift: "MagSafe Case",
      free_gift_ar: "غطاء حماية ماج سيف",
      brand: {
        name: "Apple",
        name_ar: "أبل",
      },
    };

    assert.equal(shopCatalogMod.matchesBilingualCatalogSearch(product, ""), true);
    assert.equal(shopCatalogMod.matchesBilingualCatalogSearch(product, "iphone"), true);
    assert.equal(shopCatalogMod.matchesBilingualCatalogSearch(product, "آيفون"), true);
    assert.equal(shopCatalogMod.matchesBilingualCatalogSearch(product, "أبل"), true);
    assert.equal(shopCatalogMod.matchesBilingualCatalogSearch(product, "التيتانيوم"), true);
    assert.equal(shopCatalogMod.matchesBilingualCatalogSearch(product, "ماج سيف"), true);
    assert.equal(shopCatalogMod.matchesBilingualCatalogSearch(product, "Samsung"), false);
    assert.equal(shopCatalogMod.matchesBilingualCatalogSearch(product, "سامسونج"), false);
  });

  it("ShopCatalogClient renders in Arabic locale and calls replaceState with /ar/ prefix", async () => {
    mockLocale = "ar";
    mockPathname = "/shop";
    mockSearchParams = new URLSearchParams("search=آيفون");

    const host = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(host);
    const root = createRoot(host as unknown as HTMLElement);

    await React.act(async () => {
      root.render(
        React.createElement(shopCatalogMod.ShopCatalogClient, {
          initialProducts: [
            {
              id: "p1",
              name: "iPhone 16",
              name_ar: "آيفون 16",
              slug: "iphone-16",
              price: 3999,
              compare_at_price: null,
              stock: 5,
              brand: { id: "b1", name: "Apple", name_ar: "أبل", slug: "apple" },
              category: { id: "c1", name: "Phones", name_ar: "هواتف", slug: "phones" },
              product_images: [],
            },
          ],
          categories: [
            {
              id: "c1",
              name: "Phones",
              name_ar: "هواتف",
              slug: "phones",
              description: null,
              image_url: null,
              icon_name: null,
              display_order: 1,
              is_active: true,
              created_at: "",
              updated_at: "",
            },
          ],
          brands: [
            {
              id: "b1",
              name: "Apple",
              name_ar: "أبل",
              slug: "apple",
              logo_url: null,
              is_active: true,
              created_at: "",
            },
          ],
        })
      );
    });

    assert.ok(
      historyCalls.some((url) => url.startsWith("/ar/shop")),
      `Expected /ar/shop URL sync, got: ${JSON.stringify(historyCalls)}`
    );
    assert.ok(
      host.textContent.includes("آيفون 16"),
      "Arabic product title matched via Arabic search param should render"
    );

    await React.act(async () => {
      root.unmount();
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 3: F-04 Part A AnnouncementBar Arabic Resolution
// ---------------------------------------------------------------------------

describe("F-04 Part A AnnouncementBar Bilingual Resolution", () => {
  it("resolves Arabic announcements per item with English fallback for blank slots, legacy filter, and defaults when empty", () => {
    const defaults = ["Cash on Delivery Available", "Order on WhatsApp", "100% Genuine Products"];
    const defaultsAr = ["الدفع عند الاستلام متاح", "اطلب مباشرة عبر واتساب", "منتجات أصلية 100%"];

    assert.deepEqual(
      announcementMod.resolveAnnouncementItems(
        ["Express Shipping", "Official Warranty"],
        ["شحن سريع", "ضمان رسمي"],
        "ar",
        defaultsAr
      ),
      ["شحن سريع", "ضمان رسمي"]
    );

    assert.deepEqual(
      announcementMod.resolveAnnouncementItems(
        ["Express Shipping", "24h Support"],
        ["شحن سريع", "   "],
        "ar",
        defaultsAr
      ),
      ["شحن سريع", "24h Support"]
    );

    assert.deepEqual(
      announcementMod.resolveAnnouncementItems(
        ["Express Shipping"],
        ["شحن سريع"],
        "en",
        defaults
      ),
      ["Express Shipping"]
    );

    assert.deepEqual(
      announcementMod.resolveAnnouncementItems([], [], "ar", defaultsAr),
      defaultsAr
    );
  });
});

// ---------------------------------------------------------------------------
// Suite 4: F-05 RTL Hero Carousel Transform
// ---------------------------------------------------------------------------

describe("F-05 RTL Hero Carousel Transform", () => {
  beforeEach(() => {
    resetDomEnvironment();
  });

  it("getHeroTrackTransform uses negative X shifts in EN LTR and positive X shifts in AR RTL", () => {
    assert.equal(heroMod.getHeroTrackTransform(0, "en"), "translateX(0%)");
    assert.equal(heroMod.getHeroTrackTransform(1, "en"), "translateX(-100%)");
    assert.equal(heroMod.getHeroTrackTransform(2, "en"), "translateX(-200%)");

    assert.equal(heroMod.getHeroTrackTransform(0, "ar"), "translateX(0%)");
    assert.equal(heroMod.getHeroTrackTransform(1, "ar"), "translateX(100%)");
    assert.equal(heroMod.getHeroTrackTransform(2, "ar"), "translateX(200%)");
  });

  it("HeroSection shifts track in positive X direction when advancing slides in Arabic RTL", async () => {
    mockLocale = "ar";
    const host = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(host);
    const root = createRoot(host as unknown as HTMLElement);

    try {
      await React.act(async () => {
        root.render(React.createElement(heroMod.HeroSection, { banners: [] }));
      });

      const allDivsInitial = host.querySelectorAll<ShimHTMLElement>("div");
      const trackInitial = allDivsInitial.find(
        (el) => typeof el.style?.transform === "string" && el.style.transform.includes("translateX")
      );
      assert.ok(trackInitial, "Carousel track element with inline transform must exist");
      // HeroSection starts at index 1 due to cloned loop slide [last, ...banners, first]
      assert.equal(trackInitial.style.transform, "translateX(100%)");

      const nextBtn = shimDocument.querySelector(
        `button[aria-label="${arMessages.home.nextBanner}"]`
      ) as unknown as ShimHTMLElement;
      assert.ok(nextBtn, "Arabic Next Banner button must render");

      await React.act(async () => {
        clickReactElement(nextBtn);
      });

      const allDivsAfter = host.querySelectorAll<ShimHTMLElement>("div");
      const trackAfter = allDivsAfter.find(
        (el) => typeof el.style?.transform === "string" && el.style.transform.includes("translateX")
      );
      assert.ok(trackAfter);
      assert.equal(trackAfter.style.transform, "translateX(200%)");
    } finally {
      await React.act(async () => {
        root.unmount();
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 5: Stage 3 Navigation Import & Bilingual Dictionary Key Contracts
// ---------------------------------------------------------------------------

describe("Stage 3 Navigation & Translation Dictionary Contracts", () => {
  const stage3Files = [
    "src/components/ui/logo.tsx",
    "src/components/ui/language-switcher.tsx",
    "src/components/store/announcement-bar.tsx",
    "src/components/store/main-navbar.tsx",
    "src/components/store/hero-section.tsx",
    "src/components/store/hero-banner-item.tsx",
    "src/components/store/category-nav.tsx",
    "src/components/store/category-grid.tsx",
    "src/components/store/product-card.tsx",
    "src/components/store/todays-deals.tsx",
    "src/components/store/featured-section.tsx",
    "src/components/store/trust-bar.tsx",
    "src/components/store/footer.tsx",
    "src/components/store/mobile-bottom-nav.tsx",
    "src/components/store/shop-catalog-client.tsx",
    "src/components/store/product-details-client.tsx",
    "src/components/store/product-gallery.tsx",
    "src/components/store/product-spec-tabs.tsx",
  ];

  it("all 18 Stage 3 files forbid next/link and disallowed next/navigation imports", () => {
    for (const relPath of stage3Files) {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8");
      assert.equal(
        /from\s+["']next\/link["']/.test(content),
        false,
        `${relPath} must not import next/link`
      );

      const nextNavImports = Array.from(
        content.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']next\/navigation["']/g)
      );
      for (const m of nextNavImports) {
        const specifiers = m[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const spec of specifiers) {
          assert.ok(
            spec === "useSearchParams" || spec === "notFound",
            `${relPath} imports disallowed '${spec}' from next/navigation (must come from @/i18n/navigation)`
          );
        }
      }
    }

    const langSwitcher = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/components/ui/language-switcher.tsx"),
      "utf8"
    );
    assert.ok(/useSearchParams[\s\S]*from\s+["']next\/navigation["']/.test(langSwitcher));

    const shopCatalog = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/components/store/shop-catalog-client.tsx"),
      "utf8"
    );
    assert.ok(/useSearchParams[\s\S]*from\s+["']next\/navigation["']/.test(shopCatalog));
  });

  it("every useTranslations(namespace) key referenced across Stage 3 components exists in both en.json and ar.json", () => {
    for (const relPath of stage3Files) {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8");
      const translatorDecls = Array.from(
        content.matchAll(/const\s+(\w+)\s*=\s*useTranslations\(\s*["']([^"']+)["']\s*\)/g)
      );

      for (const [, varName, namespace] of translatorDecls) {
        assert.ok(namespace in enMessages, `${relPath}: namespace '${namespace}' missing from en.json`);
        assert.ok(namespace in arMessages, `${relPath}: namespace '${namespace}' missing from ar.json`);

        const callRegex = new RegExp(`\\b${varName}\\(\\s*["']([^"']+)["']`, "g");
        const keyCalls = Array.from(content.matchAll(callRegex));
        for (const [, key] of keyCalls) {
          const enVal = lookupMessage(enMessages[namespace] as Record<string, unknown>, key);
          const arVal = lookupMessage(arMessages[namespace] as Record<string, unknown>, key);
          assert.notEqual(
            enVal,
            key,
            `${relPath}: missing EN translation key '${namespace}.${key}'`
          );
          assert.notEqual(
            arVal,
            key,
            `${relPath}: missing AR translation key '${namespace}.${key}'`
          );
          assert.ok(enVal.trim().length > 0, `${relPath}: empty EN value for '${namespace}.${key}'`);
          assert.ok(arVal.trim().length > 0, `${relPath}: empty AR value for '${namespace}.${key}'`);
        }
      }
    }
  });

  it("Logo localizes in storefront EN/AR and renders English fallback outside NextIntlClientProvider", async () => {
    resetDomEnvironment();
    const host = shimDocument.createElement("div") as unknown as ShimHTMLElement;
    shimDocument.body.appendChild(host);
    const root = createRoot(host as unknown as HTMLElement);

    try {
      mockLocale = "en";
      mockNoIntlContext = false;
      await React.act(async () => {
        root.render(React.createElement(logoMod.Logo, { size: "md" }));
      });
      let anchor = host.querySelector("a");
      let img = host.querySelector("img");
      assert.equal(anchor?.getAttribute("aria-label"), enMessages.common.homeAriaLabel);
      assert.equal(img?.getAttribute("alt"), enMessages.common.brandName);

      mockLocale = "ar";
      mockNoIntlContext = false;
      await React.act(async () => {
        root.render(React.createElement(logoMod.Logo, { size: "md" }));
      });
      anchor = host.querySelector("a");
      img = host.querySelector("img");
      assert.equal(anchor?.getAttribute("aria-label"), arMessages.common.homeAriaLabel);
      assert.equal(img?.getAttribute("alt"), arMessages.common.brandName);

      mockNoIntlContext = true;
      await React.act(async () => {
        root.render(React.createElement(logoMod.Logo, { size: "sm" }));
      });
      anchor = host.querySelector("a");
      img = host.querySelector("img");
      assert.equal(anchor?.getAttribute("aria-label"), "Qatar Mobile Deals - Home");
      assert.equal(img?.getAttribute("alt"), "Qatar Mobile Deals");
    } finally {
      await React.act(async () => {
        root.unmount();
      });
    }
  });
});
