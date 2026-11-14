"use client";

import React, { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FileText,
  TableProperties,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { resolveProductSpecifications, resolveTextField } from "@/lib/i18n/content-resolver";

interface ProductSpecTabsProps {
  description?: string | null;
  descriptionAr?: string | null;
  shortDescription?: string | null;
  shortDescriptionAr?: string | null;
  productName: string;
  productNameAr?: string | null;
  brandName?: string | null;
  brandNameAr?: string | null;
  categoryName?: string | null;
  categoryNameAr?: string | null;
  warranty?: string | null;
  warrantyAr?: string | null;
  whatsappNumber?: string;
  specs: Record<string, string>;
  specsAr?: Record<string, string> | null;
}

// Known tech acronyms and proper casing
const ACRONYMS = new Set([
  "SIM",
  "RAM",
  "ROM",
  "OS",
  "CPU",
  "GPU",
  "USB",
  "NFC",
  "GPS",
  "IP",
  "IP67",
  "IP68",
  "5G",
  "4G",
  "3G",
  "2G",
  "LTE",
  "FHD",
  "FHD+",
  "HD",
  "HD+",
  "OLED",
  "AMOLED",
  "LCD",
  "MP",
  "MAH",
  "NPU",
  "AI",
  "LED",
  "OTG",
]);

const SPEC_KEY_FORMAT_MAP: Record<string, string> = {
  "product name": "Product Name",
  "product_name": "Product Name",
  brand: "Brand",
  model: "Model",
  category: "Category",
  network: "Network",
  "sim type": "SIM Type",
  "sim_type": "SIM Type",
  sim: "SIM Type",
  "display size": "Display Size",
  "display_size": "Display Size",
  "display resolution": "Display Resolution",
  "display_resolution": "Display Resolution",
  "screen size": "Screen Size",
  "screen resolution": "Screen Resolution",
  "operating system": "Operating System",
  os: "Operating System",
  processor: "Processor / CPU",
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  rom: "ROM / Storage",
  storage: "Internal Storage",
  "internal storage": "Internal Storage",
  battery: "Battery Capacity",
  "battery capacity": "Battery Capacity",
  camera: "Camera",
  "main camera": "Main Camera",
  "front camera": "Front Camera",
  "selfie camera": "Front Camera",
  connectivity: "Connectivity",
  wifi: "Wi-Fi",
  "wi-fi": "Wi-Fi",
  bluetooth: "Bluetooth",
  usb: "USB Port",
  nfc: "NFC",
  charging: "Charging",
  weight: "Weight",
  dimensions: "Dimensions",
  warranty: "Warranty",
  color: "Color",
  "in the box": "In The Box",
};

export function formatSpecKey(rawKey: string): string {
  if (!rawKey) return "";
  const normalized = rawKey.trim().toLowerCase();
  if (SPEC_KEY_FORMAT_MAP[normalized]) {
    return SPEC_KEY_FORMAT_MAP[normalized];
  }

  return rawKey
    .replace(/[_-]/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper === "MAH" ? "mAh" : upper;
      if (word.toLowerCase() === "wi-fi" || word.toLowerCase() === "wifi") return "Wi-Fi";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function formatSpecValue(
  val: unknown,
  supportedLabel: string = "Supported",
  notSupportedLabel: string = "Not Supported"
): string {
  if (val === null || val === undefined || val === "") return "—";
  const str = String(val).trim();
  const lower = str.toLowerCase();

  if (lower === "qqqvga") return "QQVGA";
  if (lower === "qvga") return "QVGA";
  if (lower === "vga") return "VGA";
  if (lower === "fhd+") return "FHD+";
  if (lower === "hd+") return "HD+";
  if (lower === "amoled") return "AMOLED";
  if (lower === "oled") return "OLED";
  if (lower === "ips lcd") return "IPS LCD";
  if (lower === "s30+" || lower === "series 30+") return "Series 30+";
  if (lower === "type-c" || lower === "type c" || lower === "usb-c") return "USB Type-C";
  if (lower === "nano sim" || lower === "nano-sim") return "Nano SIM";
  if (lower === "yes" || lower === "true") return supportedLabel;
  if (lower === "no" || lower === "false") return notSupportedLabel;

  // Capitalize single lowercase word (e.g. "demo" -> "Demo")
  if (/^[a-z]+$/.test(str)) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return str;
}

function parseSpecsFromText(text?: string | null): Record<string, string> {
  if (!text) return {};
  const result: Record<string, string> = {};
  const lines = text.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^product\s+specifications/i.test(line) || /^specifications:?$/i.test(line)) continue;
    const colonIdx = line.indexOf(":");
    const tabIdx = line.indexOf("\t");
    let key = "";
    let val = "";
    if (colonIdx > 0 && (tabIdx === -1 || colonIdx < tabIdx)) {
      key = line.slice(0, colonIdx).trim();
      val = line.slice(colonIdx + 1).trim();
    } else if (tabIdx > 0) {
      key = line.slice(0, tabIdx).trim();
      val = line.slice(tabIdx + 1).trim();
    }
    if (key && val && key.length < 40 && !key.includes(".") && !key.includes(",")) {
      result[key] = val;
    }
  }
  return result;
}

export function ProductSpecTabs({
  description,
  descriptionAr,
  shortDescription,
  shortDescriptionAr,
  productName,
  productNameAr,
  brandName,
  brandNameAr,
  categoryName,
  categoryNameAr,
  warranty,
  warrantyAr,
  whatsappNumber = "+97455000000",
  specs,
  specsAr,
}: ProductSpecTabsProps) {
  const locale = useLocale();
  const tProduct = useTranslations("product");

  const resolvedProductName =
    resolveTextField(productName, productNameAr, locale).value || productName;
  const resolvedBrandName = resolveTextField(brandName, brandNameAr, locale, {
    optional: true,
  }).resolvedValue;
  const resolvedCategoryName = resolveTextField(categoryName, categoryNameAr, locale, {
    optional: true,
  }).resolvedValue;
  const resolvedDescription = resolveTextField(description, descriptionAr, locale, {
    optional: true,
  }).resolvedValue;
  const resolvedShortDescription = resolveTextField(shortDescription, shortDescriptionAr, locale, {
    optional: true,
  }).resolvedValue;
  const resolvedWarranty = resolveTextField(warranty, warrantyAr, locale, {
    optional: true,
  }).resolvedValue;

  // Compile full ordered & localized spec list
  const fullSpecEntries = useMemo(() => {
    const rawEntries = Object.entries(specs || {});
    const hasCustomArSpecs = specsAr && Object.keys(specsAr).length > 0;
    const parsedFromDesc =
      rawEntries.length === 0 && !hasCustomArSpecs
        ? parseSpecsFromText(resolvedDescription || description)
        : {};
    const mergedEnSource = rawEntries.length > 0 ? specs || {} : parsedFromDesc;

    const existingKeys = new Set(
      [...Object.keys(mergedEnSource), ...Object.keys(specsAr || {})].map((k) =>
        k.trim().toLowerCase().replace(/[\s-]+/g, "_")
      )
    );

    const enSpecsMap: Record<string, string> = {};
    const arSpecsMap: Record<string, string> = {};

    if (!existingKeys.has("product_name") && !existingKeys.has("name") && resolvedProductName) {
      enSpecsMap["product_name"] = productName;
      if (productNameAr?.trim() || productName !== resolvedProductName) {
        arSpecsMap["product_name"] = productNameAr?.trim() || resolvedProductName;
      }
    }

    if (!existingKeys.has("brand") && resolvedBrandName) {
      enSpecsMap["brand"] = brandName || resolvedBrandName;
      if (brandNameAr?.trim() || brandName !== resolvedBrandName) {
        arSpecsMap["brand"] = brandNameAr?.trim() || resolvedBrandName;
      }
    }

    if (!existingKeys.has("category") && resolvedCategoryName) {
      enSpecsMap["category"] = categoryName || resolvedCategoryName;
      if (categoryNameAr?.trim() || categoryName !== resolvedCategoryName) {
        arSpecsMap["category"] = categoryNameAr?.trim() || resolvedCategoryName;
      }
    }

    for (const [k, v] of Object.entries(mergedEnSource)) {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        enSpecsMap[k] = String(v);
      }
    }

    if (specsAr && typeof specsAr === "object") {
      for (const [k, v] of Object.entries(specsAr)) {
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          arSpecsMap[k] = String(v);
        }
      }
    }

    if (!existingKeys.has("warranty") && resolvedWarranty) {
      enSpecsMap["warranty"] = warranty || resolvedWarranty;
      if (warrantyAr?.trim() || warranty !== resolvedWarranty) {
        arSpecsMap["warranty"] = warrantyAr?.trim() || resolvedWarranty;
      }
    }

    const resolvedItems = resolveProductSpecifications(enSpecsMap, arSpecsMap, locale);

    return resolvedItems.map((item) => ({
      key: item.key,
      label:
        locale === "ar" && item.keyAvailability === "localized"
          ? item.label
          : formatSpecKey(item.key),
      value: formatSpecValue(item.value, tProduct("supported"), tProduct("notSupported")),
    }));
  }, [
    specs,
    specsAr,
    description,
    resolvedDescription,
    productName,
    productNameAr,
    resolvedProductName,
    brandName,
    brandNameAr,
    resolvedBrandName,
    categoryName,
    categoryNameAr,
    resolvedCategoryName,
    warranty,
    warrantyAr,
    resolvedWarranty,
    locale,
    tProduct,
  ]);

  // Clean overview text (filter out raw spec key-values if description was used)
  const overviewText = useMemo(() => {
    if (resolvedShortDescription?.trim()) return resolvedShortDescription.trim();
    const rawDesc = resolvedDescription || description;
    if (!rawDesc?.trim()) return "";
    const lines = rawDesc.split("\n");
    const proseLines = lines.filter((l) => {
      const trimmed = l.trim();
      if (!trimmed) return false;
      if (/^product\s+specifications/i.test(trimmed) || /^specifications:?$/i.test(trimmed)) return false;
      const colonIdx = trimmed.indexOf(":");
      const tabIdx = trimmed.indexOf("\t");
      if ((colonIdx > 0 && colonIdx < 40) || (tabIdx > 0 && tabIdx < 40)) {
        return false;
      }
      return true;
    });
    return proseLines.join("\n\n").trim();
  }, [resolvedShortDescription, resolvedDescription, description]);

  const hasSpecs = fullSpecEntries.length > 0;
  const [activeTab, setActiveTab] = useState<"overview" | "specs">(
    hasSpecs ? "specs" : "overview"
  );

  return (
    <section className="mt-12 sm:mt-16 pt-8 border-t border-neutral-200/90 w-full">
      {/* ── Modern Segmented Tab Switcher Bar ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="inline-flex p-1 bg-neutral-100/90 rounded-2xl border border-neutral-200/70 w-fit">
          {/* Specifications Tab Button */}
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
              activeTab === "specs"
                ? "bg-white text-[#8A1538] shadow-xs ring-1 ring-black/5"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-white/50"
            }`}
          >
            <TableProperties className="w-4 h-4 text-[#8A1538]" />
            <span>{tProduct("specifications")}</span>
            {hasSpecs && (
              <span
                className={`ms-0.5 px-2 py-0.5 text-[11px] font-extrabold rounded-full transition-colors ${
                  activeTab === "specs"
                    ? "bg-[#8A1538] text-white"
                    : "bg-neutral-200/80 text-neutral-600"
                }`}
              >
                {fullSpecEntries.length}
              </span>
            )}
          </button>

          {/* Product Overview Tab Button */}
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
              activeTab === "overview"
                ? "bg-white text-[#8A1538] shadow-xs ring-1 ring-black/5"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-white/50"
            }`}
          >
            <FileText className="w-4 h-4 text-[#8A1538]" />
            <span>{tProduct("productOverview")}</span>
          </button>
        </div>
      </div>

      {/* ── Tab Contents ── */}
      <div className="w-full">
        {/* ── Tab: Technical Specifications ── */}
        {activeTab === "specs" && (
          <div className="w-full">
            {hasSpecs ? (
              <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden w-full max-w-4xl">
                {/* Table Header Row */}
                <div className="grid grid-cols-12 bg-[#F8F9FA] border-b border-neutral-200/90 px-5 sm:px-8 py-3.5 items-center">
                  <div className="col-span-5 sm:col-span-4">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500">
                      {tProduct("specification")}
                    </span>
                  </div>
                  <div className="col-span-7 sm:col-span-8">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500">
                      {tProduct("detail")}
                    </span>
                  </div>
                </div>

                {/* Table Body Rows */}
                <div className="divide-y divide-neutral-100">
                  {fullSpecEntries.map((item) => (
                    <div
                      key={item.key}
                      className="grid grid-cols-12 px-5 sm:px-8 py-3.5 sm:py-4 items-center bg-white hover:bg-neutral-50/70 transition-colors duration-150"
                    >
                      {/* Specification Column */}
                      <div className="col-span-5 sm:col-span-4 pe-3 sm:pe-6">
                        <span className="text-xs sm:text-[14px] font-medium text-neutral-600 leading-snug block">
                          {item.label}
                        </span>
                      </div>

                      {/* Detail Column */}
                      <div className="col-span-7 sm:col-span-8">
                        <span className="text-xs sm:text-[14px] font-semibold text-neutral-900 leading-snug break-words block">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* No specifications at all */
              <div className="max-w-4xl p-8 rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 text-center">
                <TableProperties className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                <p className="text-sm font-semibold text-neutral-700">
                  {tProduct("noSpecsListed")}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {tProduct("haveSpecificQuestion")}
                </p>
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    tProduct("specsQuestionWhatsappMessage", { product: resolvedProductName })
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <span>{tProduct("askOnWhatsApp")}</span>
                  <ExternalLink className="w-3.5 h-3.5 rtl:scale-x-[-1]" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Product Overview ── */}
        {activeTab === "overview" && (
          <div className="max-w-4xl rounded-2xl border border-neutral-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="prose prose-neutral text-sm sm:text-[15px] text-neutral-700 leading-relaxed max-w-none">
              {overviewText ? (
                <p className="whitespace-pre-line leading-relaxed">{overviewText}</p>
              ) : (
                <p className="text-neutral-500 italic">
                  {tProduct("defaultOverviewFallback", { product: resolvedProductName })}
                </p>
              )}
            </div>

            {/* Qatar Store Trust Bar Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-neutral-100">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">{tProduct("genuine100")}</h4>
                  <p className="text-[11px] text-neutral-500">{tProduct("authorizedDistributor")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-100">
                <Truck className="w-5 h-5 text-[#8A1538] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">{tProduct("expressDelivery")}</h4>
                  <p className="text-[11px] text-neutral-500">{tProduct("expressDeliverySub")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-100">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">{tProduct("officialWarranty")}</h4>
                  <p className="text-[11px] text-neutral-500">{resolvedWarranty || tProduct("comprehensiveCoverage")}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
