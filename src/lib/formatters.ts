/**
 * Locale-aware formatting utilities for Qatar Mobiles
 * Adheres to conventional internationalization using standard Intl APIs.
 * Uses Western Arabic numerals (0-9) across English (en-QA) and Arabic (ar-QA-u-nu-latn)
 * for clear e-commerce pricing readability in Qatar without external services.
 */

export function formatPrice(
  amount: number | null | undefined,
  locale: string = "en",
  currency: string = "QAR"
): string {
  const numericAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const isArabic = locale === "ar";
  const resolvedCurrency = currency?.trim() || "QAR";

  const formattedNumber = new Intl.NumberFormat(
    isArabic ? "ar-QA-u-nu-latn" : "en-QA",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(numericAmount);

  if (isArabic) {
    const arCurrencyLabel = resolvedCurrency === "QAR" ? "ر.ق" : resolvedCurrency;
    return `${formattedNumber} ${arCurrencyLabel}`;
  }

  return `${resolvedCurrency} ${formattedNumber}`;
}

export function formatCurrency(
  amount: number | null | undefined,
  locale: string = "en",
  currency: string = "QAR"
): string {
  const numericAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const isArabic = locale === "ar";
  const resolvedCurrency = currency?.trim() || "QAR";

  return new Intl.NumberFormat(isArabic ? "ar-QA-u-nu-latn" : "en-QA", {
    style: "currency",
    currency: resolvedCurrency,
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

  return new Intl.NumberFormat(
    isArabic ? "ar-QA-u-nu-latn" : "en-QA",
    options
  ).format(numericVal);
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

