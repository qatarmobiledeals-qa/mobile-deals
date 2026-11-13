/**
 * Locale-aware formatting utilities for Qatar Mobiles
 * Adheres to conventional internationalization using standard Intl APIs.
 * Supports English (en-QA) and Arabic (ar-QA) without external services.
 */

export function formatPrice(amount: number | null | undefined, locale: string = "en"): string {
  const numericAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const isArabic = locale === "ar";

  const formattedNumber = new Intl.NumberFormat(isArabic ? "ar-QA" : "en-QA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericAmount);

  return isArabic ? `${formattedNumber} ر.ق` : `${formattedNumber} QAR`;
}

export function formatCurrency(
  amount: number | null | undefined,
  locale: string = "en"
): string {
  const numericAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const isArabic = locale === "ar";

  return new Intl.NumberFormat(isArabic ? "ar-QA" : "en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

export function formatNumber(
  value: number | null | undefined,
  locale: string = "en",
  options?: Intl.NumberFormatOptions
): string {
  const numericVal = typeof value === "number" && !isNaN(value) ? value : 0;
  const isArabic = locale === "ar";

  return new Intl.NumberFormat(isArabic ? "ar-QA" : "en-QA", options).format(numericVal);
}

export function formatDate(
  date: string | Date | null | undefined,
  locale: string = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const isArabic = locale === "ar";
  return new Intl.DateTimeFormat(isArabic ? "ar-QA" : "en-QA", defaultOptions).format(d);
}

