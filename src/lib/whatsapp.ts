import type { CartItem } from "../types/database";
import { formatPrice } from "./formatters";
import { resolveTextField } from "./i18n/content-resolver";

export const formatWhatsAppNumber = (rawNumber: string): string => {
  // Remove non-digit characters except leading +
  const cleaned = rawNumber.replace(/[^\d]/g, "");
  // Default Qatar country code if missing
  if (cleaned.length === 8) {
    return `974${cleaned}`;
  }
  return cleaned;
};

export const generateProductWhatsAppUrl = ({
  storeNumber = "+97455000000",
  productName,
  variantName,
  price,
  quantity = 1,
  currency = "QAR",
  locale = "en",
}: {
  storeNumber?: string;
  productName: string;
  variantName?: string | null;
  price: number;
  quantity?: number;
  currency?: string;
  locale?: string;
}): string => {
  const number = formatWhatsAppNumber(storeNumber);
  const isArabic = locale === "ar";
  const formattedPrice = formatPrice(price, isArabic ? "ar" : "en", currency);

  const lines = isArabic
    ? [
        "مرحباً موبايل ديلز 👋",
        "",
        "أود طلب المنتج التالي:",
        `المنتج: *${productName}*`,
        variantName ? `الخيار: ${variantName}` : null,
        `السعر: ${formattedPrice}`,
        `الكمية: ${quantity}`,
        "",
        "يرجى تأكيد التوفر والتوصيل في قطر.",
      ]
    : [
        "Hello Mobile Deals 👋",
        "",
        "I am interested in ordering:",
        `Product: *${productName}*`,
        variantName ? `Variant: ${variantName}` : null,
        `Price: ${currency} ${price.toLocaleString()}`,
        `Quantity: ${quantity}`,
        "",
        "Please confirm availability and delivery in Qatar.",
      ];

  const message = lines.filter((line) => line !== null).join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

export const generateCartWhatsAppUrl = ({
  storeNumber = "+97455000000",
  items,
  total,
  currency = "QAR",
  locale = "en",
}: {
  storeNumber?: string;
  items: CartItem[];
  total: number;
  currency?: string;
  locale?: string;
}): string => {
  const number = formatWhatsAppNumber(storeNumber);
  const isArabic = locale === "ar";

  const itemsText = items
    .map((item, idx) => {
      const displayName = resolveTextField(item.productName, item.productNameAr, locale).value;
      const displayVariant = resolveTextField(item.variantName, item.variantNameAr, locale, {
        optional: true,
      }).resolvedValue;
      const linePrice = item.price * item.quantity;

      const parts = isArabic
        ? [
            `${idx + 1}. *${displayName}*`,
            displayVariant ? `   الخيار: ${displayVariant}` : null,
            `   الكمية: ${item.quantity}`,
            `   السعر: ${formatPrice(linePrice, "ar", currency)}`,
          ].filter(Boolean)
        : [
            `${idx + 1}. *${displayName}*`,
            displayVariant ? `   Variant: ${displayVariant}` : null,
            `   Quantity: ${item.quantity}`,
            `   Price: ${currency} ${linePrice.toLocaleString()}`,
          ].filter(Boolean);
      return parts.join("\n");
    })
    .join("\n\n");

  const lines = isArabic
    ? [
        "مرحباً موبايل ديلز 👋",
        "",
        "أود طلب المنتجات التالية:",
        "",
        itemsText,
        "",
        `*إجمالي مبلغ الطلب: ${formatPrice(total, "ar", currency)}*`,
        "طريقة الدفع: الدفع عند الاستلام",
        "",
        "يرجى تأكيد طلبي وترتيب التوصيل.",
      ]
    : [
        "Hello Mobile Deals 👋",
        "",
        "I would like to order the following items:",
        "",
        itemsText,
        "",
        `*Total Order Amount: ${currency} ${total.toLocaleString()}*`,
        "Payment Method: Cash on Delivery",
        "",
        "Please confirm my order and arrange delivery.",
      ];

  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
};
