/**
 * Safe search query sanitization and PostgREST `.or()` / `.ilike.` pattern construction.
 * Prevents structural delimiter injection into PostgREST query strings and escapes
 * SQL single-character `_` wildcards inside double-quoted operands.
 */

export const MAX_SEARCH_QUERY_LENGTH = 60;

export const SEARCH_PRODUCT_COLUMNS = [
  "name",
  "name_ar",
  "short_description",
  "short_description_ar",
  "free_gift",
  "free_gift_ar",
] as const;

/**
 * Strip PostgREST logic delimiters/operators and return normalized search tokens
 * preserving Unicode letters, digits, whitespace, and internal `.`, `-`, `_` connectors.
 */
export function sanitizeSearchQuery(rawQuery: string | null | undefined): string {
  if (!rawQuery || typeof rawQuery !== "string") return "";

  const normalized = rawQuery.normalize("NFKC").trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
  if (!normalized) return "";

  // Strip PostgREST structural delimiters, quotes, backslashes, wildcards, and SQL operators
  const withoutOperators = normalized.replace(/[,()"'\\%*;=#]+/g, " ");

  // Retain only Unicode letters, numbers, whitespace, and internal . - _ connectors
  const safeChars = withoutOperators.replace(/[^\p{L}\p{N}\s.\-_]+/gu, " ");

  const cleanedTokens = safeChars
    .split(/\s+/)
    .map((token) => token.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter((token) => /[\p{L}\p{N}]/u.test(token));

  return cleanedTokens.join(" ").trim();
}

/**
 * Encode sanitized search text as a double-quoted PostgREST `ilike` pattern (`"*...*"`)
 * with literal SQL `_` characters double-backslash escaped (`\\_`) so PostgREST's
 * quoted-value parser passes `\_` through to PostgreSQL ILIKE.
 */
export function formatPostgrestIlikePattern(
  rawQuery: string | null | undefined
): string | null {
  const sanitized = sanitizeSearchQuery(rawQuery);
  if (!sanitized) return null;

  const sqlEscaped = sanitized.replace(/_/g, "\\\\_");
  return `"*${sqlEscaped}*"`;
}

function joinBilingualIlikeClause(
  columns: readonly string[],
  rawQuery: string | null | undefined
): string | null {
  const pattern = formatPostgrestIlikePattern(rawQuery);
  if (!pattern) return null;

  return columns.map((col) => `${col}.ilike.${pattern}`).join(",");
}

/** Build the 6-column bilingual `.or(...)` filter clause for product searches. */
export function buildProductSearchOrFilter(
  rawQuery: string | null | undefined
): string | null {
  return joinBilingualIlikeClause(SEARCH_PRODUCT_COLUMNS, rawQuery);
}

/** Build the 2-column bilingual `.or(...)` filter clause for category & brand lookups. */
export function buildNameBilingualOrFilter(
  rawQuery: string | null | undefined
): string | null {
  return joinBilingualIlikeClause(["name", "name_ar"], rawQuery);
}

