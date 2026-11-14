import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const EN_PATH = path.join(ROOT_DIR, "src", "messages", "en.json");
const AR_PATH = path.join(ROOT_DIR, "src", "messages", "ar.json");

const REQUIRED_NAMESPACES = [
  "common",
  "nav",
  "announcement",
  "home",
  "shop",
  "search",
  "product",
  "specs",
  "cart",
  "checkout",
  "orderSuccess",
  "orderStatus",
  "trust",
  "forms",
  "footer",
  "mobileNav",
  "metadata",
  "errors",
] as const;

/**
 * Keys in ar.json whose intended value is intentionally Latin/technical script
 * rather than Arabic script.
 */
const AR_NON_ARABIC_ALLOWLIST = new Set<string>([
  "common.english",
  "common.enShort",
  "checkout.emailPlaceholder",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ============================================================================
// 1. Structural JSON Duplicate-Key Detector
// ============================================================================

interface DuplicateKeyFinding {
  path: string;
  line: number;
}

/**
 * Parses raw JSON text using a recursive-descent scanner to detect duplicate
 * object keys at any nesting depth before JavaScript's JSON.parse overwrites them.
 */
function findDuplicateJsonKeys(rawJson: string): DuplicateKeyFinding[] {
  const duplicates: DuplicateKeyFinding[] = [];
  let pos = 0;
  let line = 1;

  function skipWhitespace(): void {
    while (pos < rawJson.length) {
      const ch = rawJson[pos];
      if (ch === "\n") {
        line += 1;
        pos += 1;
      } else if (ch === " " || ch === "\t" || ch === "\r") {
        pos += 1;
      } else {
        break;
      }
    }
  }

  function parseString(): string {
    if (rawJson[pos] !== '"') {
      throw new SyntaxError(`Expected '"' at offset ${pos} (line ${line})`);
    }
    pos += 1;
    let out = "";
    while (pos < rawJson.length) {
      const ch = rawJson[pos];
      if (ch === '"') {
        pos += 1;
        return out;
      }
      if (ch === "\\") {
        pos += 1;
        if (pos >= rawJson.length) {
          throw new SyntaxError(`Unterminated escape at line ${line}`);
        }
        const esc = rawJson[pos];
        if (esc === "u") {
          const hex = rawJson.slice(pos + 1, pos + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw new SyntaxError(`Invalid unicode escape \\u${hex} at line ${line}`);
          }
          out += String.fromCharCode(Number.parseInt(hex, 16));
          pos += 5;
        } else {
          const escapeMap: Record<string, string> = {
            '"': '"',
            "\\": "\\",
            "/": "/",
            b: "\b",
            f: "\f",
            n: "\n",
            r: "\r",
            t: "\t",
          };
          if (!(esc in escapeMap)) {
            throw new SyntaxError(`Invalid escape \\${esc} at line ${line}`);
          }
          out += escapeMap[esc];
          pos += 1;
        }
      } else {
        if (ch === "\n") {
          line += 1;
        }
        out += ch;
        pos += 1;
      }
    }
    throw new SyntaxError(`Unterminated string literal at line ${line}`);
  }

  function parseLiteral(expected: string): void {
    if (!rawJson.startsWith(expected, pos)) {
      throw new SyntaxError(`Expected '${expected}' at line ${line}`);
    }
    pos += expected.length;
  }

  function parseNumber(): void {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(
      rawJson.slice(pos)
    );
    if (!match) {
      throw new SyntaxError(`Invalid number at line ${line}`);
    }
    pos += match[0].length;
  }

  function parseValue(currentPath: string): void {
    skipWhitespace();
    if (pos >= rawJson.length) {
      throw new SyntaxError(`Unexpected end of JSON input at line ${line}`);
    }
    const ch = rawJson[pos];
    if (ch === "{") {
      parseObject(currentPath);
    } else if (ch === "[") {
      parseArray(currentPath);
    } else if (ch === '"') {
      parseString();
    } else if (ch === "t") {
      parseLiteral("true");
    } else if (ch === "f") {
      parseLiteral("false");
    } else if (ch === "n") {
      parseLiteral("null");
    } else {
      parseNumber();
    }
  }

  function parseArray(currentPath: string): void {
    pos += 1; // '['
    skipWhitespace();
    if (rawJson[pos] === "]") {
      pos += 1;
      return;
    }
    let idx = 0;
    while (true) {
      parseValue(`${currentPath}[${idx}]`);
      idx += 1;
      skipWhitespace();
      if (rawJson[pos] === ",") {
        pos += 1;
      } else if (rawJson[pos] === "]") {
        pos += 1;
        return;
      } else {
        throw new SyntaxError(`Expected ',' or ']' in array at line ${line}`);
      }
    }
  }

  function parseObject(currentPath: string): void {
    pos += 1; // '{'
    skipWhitespace();
    if (rawJson[pos] === "}") {
      pos += 1;
      return;
    }
    const seenKeys = new Set<string>();
    while (true) {
      skipWhitespace();
      const keyLine = line;
      const key = parseString();
      const keyPath = currentPath ? `${currentPath}.${key}` : key;
      if (seenKeys.has(key)) {
        duplicates.push({ path: keyPath, line: keyLine });
      } else {
        seenKeys.add(key);
      }
      skipWhitespace();
      if (rawJson[pos] !== ":") {
        throw new SyntaxError(`Expected ':' after key "${key}" at line ${line}`);
      }
      pos += 1;
      parseValue(keyPath);
      skipWhitespace();
      if (rawJson[pos] === ",") {
        pos += 1;
      } else if (rawJson[pos] === "}") {
        pos += 1;
        return;
      } else {
        throw new SyntaxError(`Expected ',' or '}' in object at line ${line}`);
      }
    }
  }

  parseValue("");
  skipWhitespace();
  if (pos !== rawJson.length) {
    throw new SyntaxError(`Unexpected trailing content at line ${line}`);
  }
  return duplicates;
}

// ============================================================================
// 2. Recursive Key-Parity & Structural Validator
// ============================================================================

interface ParityReport {
  missingInAr: string[];
  missingInEn: string[];
  structureMismatches: string[];
  invalidValues: string[];
}

function formatParityReport(report: ParityReport): string {
  const lines: string[] = [];
  if (report.missingInAr.length > 0) {
    lines.push(`Missing in ar.json (${report.missingInAr.length}): ${report.missingInAr.join(", ")}`);
  }
  if (report.missingInEn.length > 0) {
    lines.push(`Missing in en.json (${report.missingInEn.length}): ${report.missingInEn.join(", ")}`);
  }
  if (report.structureMismatches.length > 0) {
    lines.push(
      `Structure mismatches (${report.structureMismatches.length}): ${report.structureMismatches.join("; ")}`
    );
  }
  if (report.invalidValues.length > 0) {
    lines.push(`Invalid values (${report.invalidValues.length}): ${report.invalidValues.join("; ")}`);
  }
  return lines.join("\n");
}

function validateDictionaryParity(
  enObj: Record<string, unknown>,
  arObj: Record<string, unknown>
): ParityReport {
  const report: ParityReport = {
    missingInAr: [],
    missingInEn: [],
    structureMismatches: [],
    invalidValues: [],
  };

  function collectLeafPaths(obj: Record<string, unknown>, prefix: string, target: string[]): void {
    for (const [k, v] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${k}` : k;
      if (isPlainObject(v)) {
        collectLeafPaths(v, fullPath, target);
      } else {
        target.push(fullPath);
      }
    }
  }

  function walk(enNode: Record<string, unknown>, arNode: Record<string, unknown>, prefix: string): void {
    const enKeys = Object.keys(enNode);
    const arKeys = Object.keys(arNode);
    const arKeySet = new Set(arKeys);
    const enKeySet = new Set(enKeys);

    for (const key of enKeys) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const enVal = enNode[key];

      if (!arKeySet.has(key)) {
        if (isPlainObject(enVal)) {
          report.missingInAr.push(fullPath);
          collectLeafPaths(enVal, fullPath, report.missingInAr);
        } else {
          report.missingInAr.push(fullPath);
        }
        continue;
      }

      const arVal = arNode[key];
      const enIsObj = isPlainObject(enVal);
      const arIsObj = isPlainObject(arVal);

      if (enIsObj && arIsObj) {
        if (Object.keys(enVal).length === 0) {
          report.invalidValues.push(`en:${fullPath} is an empty namespace object`);
        }
        if (Object.keys(arVal).length === 0) {
          report.invalidValues.push(`ar:${fullPath} is an empty namespace object`);
        }
        walk(enVal, arVal, fullPath);
        continue;
      }

      if (enIsObj !== arIsObj) {
        report.structureMismatches.push(
          `${fullPath} (en=${enIsObj ? "object" : typeof enVal}, ar=${arIsObj ? "object" : typeof arVal})`
        );
        continue;
      }

      if (typeof enVal !== "string" || enVal.trim().length === 0) {
        report.invalidValues.push(`en:${fullPath} must be a non-empty string`);
      }
      if (typeof arVal !== "string" || arVal.trim().length === 0) {
        report.invalidValues.push(`ar:${fullPath} must be a non-empty string`);
      }
    }

    for (const key of arKeys) {
      if (!enKeySet.has(key)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        const arVal = arNode[key];
        if (isPlainObject(arVal)) {
          report.missingInEn.push(fullPath);
          collectLeafPaths(arVal, fullPath, report.missingInEn);
        } else {
          report.missingInEn.push(fullPath);
        }
      }
    }
  }

  walk(enObj, arObj, "");
  return report;
}

// ============================================================================
// 3. ICU Message Syntax & Interpolation Placeholder Validator
// ============================================================================

interface ExtractedMessageAnalysis {
  placeholders: string[];
  icuErrors: string[];
}

const VALID_ARG_NAME_RE = /^[a-zA-Z0-9_]+$/;
const ICU_FORMATS = new Set(["number", "date", "time", "plural", "select", "selectordinal"]);

function extractTopLevelBracedBlocks(text: string): {
  blocks: string[];
  unbalancedError: string | null;
} {
  const blocks: string[] = [];
  let depth = 0;
  let blockStart = -1;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") {
      if (depth === 0) {
        blockStart = i + 1;
      }
      depth += 1;
    } else if (ch === "}") {
      if (depth === 0) {
        return { blocks, unbalancedError: `Unmatched closing '}' at index ${i}` };
      }
      depth -= 1;
      if (depth === 0) {
        blocks.push(text.slice(blockStart, i));
        blockStart = -1;
      }
    }
  }

  if (depth !== 0) {
    return { blocks, unbalancedError: `Unclosed '{' opening brace (remaining depth ${depth})` };
  }
  return { blocks, unbalancedError: null };
}

function analyzeMessage(message: string): ExtractedMessageAnalysis {
  const placeholders = new Set<string>();
  const icuErrors: string[] = [];

  function scanText(segment: string): void {
    const { blocks, unbalancedError } = extractTopLevelBracedBlocks(segment);
    if (unbalancedError) {
      icuErrors.push(unbalancedError);
      return;
    }

    for (const block of blocks) {
      const commaIdx = block.indexOf(",");
      if (commaIdx === -1) {
        const argName = block.trim();
        if (!VALID_ARG_NAME_RE.test(argName)) {
          icuErrors.push(`Invalid interpolation placeholder "{${block}}"`);
        } else {
          placeholders.add(argName);
        }
        continue;
      }

      const argName = block.slice(0, commaIdx).trim();
      if (!VALID_ARG_NAME_RE.test(argName)) {
        icuErrors.push(`Invalid ICU argument name "${argName}" in "{${block}}"`);
        continue;
      }

      const rest = block.slice(commaIdx + 1);
      const secondCommaIdx = rest.indexOf(",");
      const formatType = (secondCommaIdx === -1 ? rest : rest.slice(0, secondCommaIdx)).trim();

      if (!ICU_FORMATS.has(formatType)) {
        icuErrors.push(`Unsupported ICU format "${formatType}" for argument "${argName}"`);
        continue;
      }

      placeholders.add(`${argName}:${formatType}`);

      if (
        (formatType === "plural" || formatType === "select" || formatType === "selectordinal") &&
        secondCommaIdx !== -1
      ) {
        const clausesBody = rest.slice(secondCommaIdx + 1);
        const { blocks: clauseMessages, unbalancedError: nestedErr } =
          extractTopLevelBracedBlocks(clausesBody);
        if (nestedErr) {
          icuErrors.push(`Nested ICU error in "${argName}": ${nestedErr}`);
        } else if (clauseMessages.length === 0) {
          icuErrors.push(`ICU ${formatType} block for "${argName}" has no selector clauses`);
        } else {
          for (const clauseText of clauseMessages) {
            scanText(clauseText);
          }
        }
      }
    }
  }

  scanText(message);
  return {
    placeholders: Array.from(placeholders).sort(),
    icuErrors,
  };
}

interface PlaceholderReport {
  syntaxErrors: string[];
  placeholderMismatches: string[];
  checkedLeafCount: number;
}

function validateIcuAndPlaceholderParity(
  enObj: Record<string, unknown>,
  arObj: Record<string, unknown>
): PlaceholderReport {
  const syntaxErrors: string[] = [];
  const placeholderMismatches: string[] = [];
  let checkedLeafCount = 0;

  function walk(enNode: Record<string, unknown>, arNode: Record<string, unknown>, prefix: string): void {
    for (const [key, enVal] of Object.entries(enNode)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const arVal = arNode[key];

      if (isPlainObject(enVal) && isPlainObject(arVal)) {
        walk(enVal, arVal, fullPath);
      } else if (typeof enVal === "string" && typeof arVal === "string") {
        checkedLeafCount += 1;
        const enAnalysis = analyzeMessage(enVal);
        const arAnalysis = analyzeMessage(arVal);

        for (const err of enAnalysis.icuErrors) {
          syntaxErrors.push(`en:${fullPath}: ${err}`);
        }
        for (const err of arAnalysis.icuErrors) {
          syntaxErrors.push(`ar:${fullPath}: ${err}`);
        }

        const enList = enAnalysis.placeholders.join(",");
        const arList = arAnalysis.placeholders.join(",");
        if (enList !== arList) {
          placeholderMismatches.push(
            `${fullPath} (en=[${enList}], ar=[${arList}])`
          );
        }
      }
    }
  }

  walk(enObj, arObj, "");
  return { syntaxErrors, placeholderMismatches, checkedLeafCount };
}

function flattenLeaves(obj: Record<string, unknown>, prefix = ""): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(val)) {
      entries.push(...flattenLeaves(val, fullPath));
    } else if (typeof val === "string") {
      entries.push([fullPath, val]);
    }
  }
  return entries;
}

// ============================================================================
// TEST SUITE
// ============================================================================

test("Stage 2 Dictionaries: en.json and ar.json parse cleanly and contain zero duplicate JSON keys", () => {
  const enRaw = fs.readFileSync(EN_PATH, "utf8");
  const arRaw = fs.readFileSync(AR_PATH, "utf8");

  const enParsed: unknown = JSON.parse(enRaw);
  const arParsed: unknown = JSON.parse(arRaw);

  assert.ok(isPlainObject(enParsed), "src/messages/en.json root must be a JSON object");
  assert.ok(isPlainObject(arParsed), "src/messages/ar.json root must be a JSON object");
  assert.ok(Object.keys(enParsed).length > 0, "en.json must not be empty");
  assert.ok(Object.keys(arParsed).length > 0, "ar.json must not be empty");

  const enDuplicates = findDuplicateJsonKeys(enRaw);
  const arDuplicates = findDuplicateJsonKeys(arRaw);

  assert.deepEqual(
    enDuplicates,
    [],
    `Duplicate JSON keys in en.json: ${JSON.stringify(enDuplicates)}`
  );
  assert.deepEqual(
    arDuplicates,
    [],
    `Duplicate JSON keys in ar.json: ${JSON.stringify(arDuplicates)}`
  );
});

test("Stage 2 Dictionaries: 100% recursive key parity, namespace completeness, and structure match", () => {
  const enObj = JSON.parse(fs.readFileSync(EN_PATH, "utf8")) as Record<string, unknown>;
  const arObj = JSON.parse(fs.readFileSync(AR_PATH, "utf8")) as Record<string, unknown>;

  for (const ns of REQUIRED_NAMESPACES) {
    assert.ok(isPlainObject(enObj[ns]), `en.json missing required namespace: ${ns}`);
    assert.ok(isPlainObject(arObj[ns]), `ar.json missing required namespace: ${ns}`);
  }

  const report = validateDictionaryParity(enObj, arObj);
  const formatted = formatParityReport(report);

  assert.equal(report.missingInAr.length, 0, formatted);
  assert.equal(report.missingInEn.length, 0, formatted);
  assert.equal(report.structureMismatches.length, 0, formatted);
  assert.equal(report.invalidValues.length, 0, formatted);

  const enLeaves = flattenLeaves(enObj);
  const arLeaves = flattenLeaves(arObj);
  assert.equal(enLeaves.length, arLeaves.length);
  assert.ok(enLeaves.length >= 250, `Expected comprehensive dictionary coverage, got ${enLeaves.length} keys`);
});

test("Stage 2 Dictionaries: 100% interpolation placeholder parity & valid ICU syntax across every key", () => {
  const enObj = JSON.parse(fs.readFileSync(EN_PATH, "utf8")) as Record<string, unknown>;
  const arObj = JSON.parse(fs.readFileSync(AR_PATH, "utf8")) as Record<string, unknown>;

  const result = validateIcuAndPlaceholderParity(enObj, arObj);

  assert.equal(
    result.syntaxErrors.length,
    0,
    `ICU/message syntax errors:\n${result.syntaxErrors.join("\n")}`
  );
  assert.equal(
    result.placeholderMismatches.length,
    0,
    `Placeholder mismatches:\n${result.placeholderMismatches.join("\n")}`
  );
  assert.ok(result.checkedLeafCount >= 250);
});

test("Stage 2 Dictionaries: Arabic translations contain Arabic script (no accidental English fallback) and preserve zero-arg contracts", () => {
  const enObj = JSON.parse(fs.readFileSync(EN_PATH, "utf8")) as Record<string, unknown>;
  const arObj = JSON.parse(fs.readFileSync(AR_PATH, "utf8")) as Record<string, unknown>;

  const arLeaves = flattenLeaves(arObj);
  const missingArabicScript: string[] = [];

  for (const [keyPath, value] of arLeaves) {
    if (AR_NON_ARABIC_ALLOWLIST.has(keyPath)) {
      continue;
    }
    if (!/[\u0600-\u06FF]/.test(value)) {
      missingArabicScript.push(`${keyPath}="${value}"`);
    }
  }

  assert.deepEqual(
    missingArabicScript,
    [],
    `Keys in ar.json without Arabic script (possible silent English fallback): ${missingArabicScript.join(", ")}`
  );

  // Confirm typo fix in checkout.subtitle and preserved zero-arg product.freeGift contract
  const checkoutAr = arObj.checkout as Record<string, unknown>;
  assert.equal(
    typeof checkoutAr.subtitle === "string" && !checkoutAr.subtitle.includes("ودول قطر"),
    true,
    "checkout.subtitle must not contain the old 'ودول قطر' typo"
  );
  assert.equal(
    typeof checkoutAr.subtitle === "string" && checkoutAr.subtitle.includes("ومدن قطر"),
    true
  );

  const productEn = enObj.product as Record<string, unknown>;
  const productAr = arObj.product as Record<string, unknown>;
  assert.equal(productEn.freeGift, "Free Gift Included");
  assert.equal(productAr.freeGift, "هدية مجانية مميزة");
  assert.equal(productEn.freeGiftNamed, "Free Gift: {gift}");
  assert.equal(productAr.freeGiftNamed, "هدية مجانية: {gift}");
});

test("Stage 2 Validator Self-Test: catches duplicate keys, missing keys, structure mismatches, placeholder mismatches & invalid ICU syntax", () => {
  // Duplicate keys (top-level and nested)
  const rawWithDuplicates = `{
    "nav": { "home": "Home", "shop": "Shop", "home": "Duplicate Home" },
    "common": { "ok": "OK" },
    "common": { "ok": "Duplicate Namespace" }
  }`;
  const dups = findDuplicateJsonKeys(rawWithDuplicates).map((d) => d.path);
  assert.deepEqual(dups, ["nav.home", "common"]);

  // Recursive parity discrepancies
  const sampleEn = {
    common: { save: "Save", missingInArKey: "Only EN" },
    nav: { home: "Home" },
    mismatchNs: { nested: "Value" },
  };
  const sampleAr = {
    common: { save: "حفظ", extraInArKey: "فقط عربي" },
    nav: { home: "الرئيسية" },
    mismatchNs: "Should be object",
  };
  const parity = validateDictionaryParity(sampleEn, sampleAr);
  assert.deepEqual(parity.missingInAr, ["common.missingInArKey"]);
  assert.deepEqual(parity.missingInEn, ["common.extraInArKey"]);
  assert.equal(parity.structureMismatches.length, 1);
  assert.ok(parity.structureMismatches[0].startsWith("mismatchNs "));

  // Placeholder mismatch & invalid ICU braces / placeholder names
  const badSyntaxEn = {
    shop: {
      found: "Found {count} products for {query}",
      broken: "Broken {unclosed brace",
      badArg: "Hello world",
    },
  };
  const badSyntaxAr = {
    shop: {
      found: "تم العثور على {count} منتج",
      broken: "مغلق صحيح",
      badArg: "مرحباً {bad-arg}",
    },
  };
  const placeholderRes = validateIcuAndPlaceholderParity(badSyntaxEn, badSyntaxAr);
  assert.equal(placeholderRes.syntaxErrors.length, 2);
  assert.ok(placeholderRes.syntaxErrors.some((e) => e.includes("en:shop.broken")));
  assert.ok(placeholderRes.syntaxErrors.some((e) => e.includes("ar:shop.badArg")));
  assert.equal(placeholderRes.placeholderMismatches.length, 1);
  assert.ok(placeholderRes.placeholderMismatches[0].startsWith("shop.found "));

  // Valid complex ICU plural parity
  const icuEn = {
    shop: {
      itemsCount: "{count, plural, =0 {No items} one {# item for {name}} other {# items for {name}}}",
    },
  };
  const icuAr = {
    shop: {
      itemsCount:
        "{count, plural, zero {لا توجد منتجات لـ {name}} one {منتج واحد لـ {name}} other {# منتج لـ {name}}}",
    },
  };
  const icuRes = validateIcuAndPlaceholderParity(icuEn, icuAr);
  assert.equal(icuRes.syntaxErrors.length, 0);
  assert.equal(icuRes.placeholderMismatches.length, 0);
});
