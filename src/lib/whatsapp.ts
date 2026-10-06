import { CartItem } from "@/types/database";

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
}: {
  storeNumber?: string;
  productName: string;
  variantName?: string | null;
  price: number;
  quantity?: number;
  currency?: string;
}): string => {
  const number = formatWhatsAppNumber(storeNumber);
  const lines = [
    "Hello Mobile Deals 👋",
    "",
    "I am interested in ordering:",
    `Product: *${productName}*`,
    variantName ? `Variant: ${variantName}` : null,
    `Price: ${currency} ${price.toLocaleString()}`,
    `Quantity: ${quantity}`,
    "",
    "Please confirm availability and delivery in Qatar.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(lines)}`;
};

export const generateCartWhatsAppUrl = ({
  storeNumber = "+97455000000",
  items,
  total,
  currency = "QAR",
}: {
  storeNumber?: string;
  items: CartItem[];
  total: number;
  currency?: string;
}): string => {
  const number = formatWhatsAppNumber(storeNumber);
  const itemsText = items
    .map((item, idx) => {
      const parts = [
        `${idx + 1}. *${item.productName}*`,
        item.variantName ? `   Variant: ${item.variantName}` : null,
        `   Quantity: ${item.quantity}`,
        `   Price: ${currency} ${(item.price * item.quantity).toLocaleString()}`,
      ].filter(Boolean);
      return parts.join("\n");
    })
    .join("\n\n");

  const lines = [
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
  ].join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(lines)}`;
};
