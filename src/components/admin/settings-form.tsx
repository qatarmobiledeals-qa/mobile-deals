"use client";

import React, { useState } from "react";
import { updateSiteSettingsAction } from "@/app/actions/admin";
import { SiteSettings } from "@/types/database";
import {
  Loader2,
  CheckCircle2,
  Truck,
  Building2,
  Phone,
  Mail,
  Coins,
  Save,
  Info,
  Megaphone,
  ShieldCheck,
  Languages,
  Plus,
  Trash2,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface SettingsFormProps {
  initialSettings: SiteSettings;
}

const DEFAULT_ANNOUNCEMENTS_EN = [
  "Cash on Delivery Available",
  "Order on WhatsApp",
  "100% Genuine Products",
];

const DEFAULT_ANNOUNCEMENTS_AR = [
  "الدفع عند الاستلام متاح",
  "الطلب عبر واتساب",
  "منتجات أصلية 100%",
];

const DEFAULT_TRUST_BADGES = [
  { title: "Top Brands", title_ar: "أفضل العلامات التجارية", subtitle: "100% Authentic gear", subtitle_ar: "منتجات أصلية 100%", icon: "trophy" },
  { title: "Qatar Wide Delivery", title_ar: "توصيل شامل لكل قطر", subtitle: "Fast doorstep shipping", subtitle_ar: "شحن سريع حتى باب منزلك", icon: "truck" },
  { title: "Best Prices", title_ar: "أفضل الأسعار", subtitle: "Unbeatable Qatar deals", subtitle_ar: "عروض تنافسية حصرية", icon: "thumbs-up" },
  { title: "Dedicated Support", title_ar: "دعم مخصص", subtitle: "WhatsApp assistance", subtitle_ar: "مساعدة مباشرة عبر واتساب", icon: "headset" },
  { title: "Secure Ordering", title_ar: "طلب آمن ومضمون", subtitle: "Cash on Delivery verified", subtitle_ar: "دفع نقدي موثوق عند الاستلام", icon: "shield-check" },
];

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    store_name: initialSettings.store_name || "MOBILE DEALS",
    store_name_ar: initialSettings.store_name_ar || "موبايل ديلز",
    whatsapp_number: initialSettings.whatsapp_number || "97455000000",
    support_phone: initialSettings.support_phone || "97455000000",
    store_email: initialSettings.store_email || "support@mobiledeals.qa",
    currency: initialSettings.currency || "QAR",
    shipping_charge:
      typeof initialSettings.shipping_charge === "number"
        ? initialSettings.shipping_charge
        : 0,
    free_delivery_threshold: initialSettings.free_delivery_threshold || 100,
  });

  // Announcement Bar State
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    initialSettings.announcement_bar?.enabled ?? true
  );
  const [announcementItems, setAnnouncementItems] = useState<string[]>(
    initialSettings.announcement_bar?.items && initialSettings.announcement_bar.items.length > 0
      ? initialSettings.announcement_bar.items
      : DEFAULT_ANNOUNCEMENTS_EN
  );
  const [announcementItemsAr, setAnnouncementItemsAr] = useState<string[]>(
    initialSettings.announcement_bar?.items_ar && initialSettings.announcement_bar.items_ar.length > 0
      ? initialSettings.announcement_bar.items_ar
      : DEFAULT_ANNOUNCEMENTS_AR
  );

  // Trust Badges State
  const [trustBadges, setTrustBadges] = useState(
    initialSettings.trust_badges?.items && initialSettings.trust_badges.items.length > 0
      ? initialSettings.trust_badges.items
      : DEFAULT_TRUST_BADGES
  );

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Announcement handlers
  const handleAddAnnouncementItem = (isAr: boolean) => {
    if (isAr) {
      setAnnouncementItemsAr((prev) => [...prev, ""]);
    } else {
      setAnnouncementItems((prev) => [...prev, ""]);
    }
  };

  const handleRemoveAnnouncementItem = (index: number, isAr: boolean) => {
    if (isAr) {
      setAnnouncementItemsAr((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setAnnouncementItems((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleUpdateAnnouncementItem = (index: number, value: string, isAr: boolean) => {
    if (isAr) {
      setAnnouncementItemsAr((prev) =>
        prev.map((item, idx) => (idx === index ? value : item))
      );
    } else {
      setAnnouncementItems((prev) =>
        prev.map((item, idx) => (idx === index ? value : item))
      );
    }
  };

  // Trust Badge handlers
  const handleUpdateTrustBadge = (
    index: number,
    field: "title" | "title_ar" | "subtitle" | "subtitle_ar",
    value: string
  ) => {
    setTrustBadges((prev) =>
      prev.map((badge, idx) =>
        idx === index ? { ...badge, [field]: value } : badge
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: Partial<SiteSettings> = {
      store_name: formData.store_name.trim(),
      store_name_ar: formData.store_name_ar.trim() || null,
      whatsapp_number: formData.whatsapp_number.trim(),
      support_phone: formData.support_phone.trim(),
      store_email: formData.store_email.trim(),
      currency: formData.currency.trim() || "QAR",
      shipping_charge: Math.max(0, Number(formData.shipping_charge) || 0),
      free_delivery_threshold: Number(formData.free_delivery_threshold) || 100,
      announcement_bar: {
        enabled: announcementEnabled,
        items: announcementItems.filter((i) => i.trim().length > 0),
        items_ar: announcementItemsAr.filter((i) => i.trim().length > 0),
      },
      trust_badges: {
        items: trustBadges.map((badge) => ({
          title: badge.title.trim(),
          title_ar: badge.title_ar?.trim() || null,
          subtitle: badge.subtitle?.trim() || "",
          subtitle_ar: badge.subtitle_ar?.trim() || null,
          icon: badge.icon,
        })),
      },
    };

    const res = await updateSiteSettingsAction(payload);
    setLoading(false);

    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Failed to save settings: " + res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* ── 1. Shipping & Delivery Settings Card ── */}
      <div className="bg-neutral-900/95 border border-neutral-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Shipping &amp; Delivery Settings
              </h2>
              <p className="text-xs text-neutral-400">
                Global fixed delivery fee applied to all customer orders nationwide across Qatar.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
              Fixed Delivery Charge ({formData.currency}) <span className="text-rose-500">*</span>
            </label>

            <div className="flex items-center rounded-2xl bg-neutral-950 border border-neutral-800 focus-within:border-[#8A1538] focus-within:ring-2 focus-within:ring-[#8A1538]/20 transition-all overflow-hidden shadow-inner">
              <div className="px-4 py-3 bg-neutral-900/80 border-r border-neutral-800 text-xs font-bold text-neutral-400 select-none flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{formData.currency}</span>
              </div>

              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={formData.shipping_charge}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shipping_charge: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                placeholder="e.g. 10.00 (Enter 0 for Free Delivery)"
                className="w-full px-4 py-3 bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 text-neutral-400 text-xs mt-3 leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Enter <strong>0</strong> for Free Delivery. Any amount set here is added directly to customer checkout and stored with each order.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Store Identity & Communication Card ── */}
      <div className="bg-neutral-900/95 border border-neutral-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800/80">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[#ff4b77] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Store &amp; Contact Configurations
            </h2>
            <p className="text-xs text-neutral-400">
              Manage bilingual store branding, official Qatar WhatsApp hotline, and customer support channels.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Store Names (EN + AR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold uppercase tracking-wider text-neutral-300">
                Store Brand Name (English)
              </label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) =>
                  setFormData({ ...formData, store_name: e.target.value })
                }
                className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-medium text-sm focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                <span>اسم المتجر (بالعربية)</span>
                <span className="text-[10px] text-neutral-500 font-mono">RTL</span>
              </label>
              <input
                type="text"
                dir="rtl"
                value={formData.store_name_ar}
                onChange={(e) =>
                  setFormData({ ...formData, store_name_ar: e.target.value })
                }
                placeholder="مثال: موبايل ديلز"
                className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-medium text-sm text-right focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/20 transition-all"
              />
            </div>
          </div>

          {/* Official WhatsApp */}
          <div className="space-y-1.5">
            <label className="block font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
              <span>Official WhatsApp Order Number (Qatar) <span className="text-rose-500">*</span></span>
            </label>
            <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={formData.whatsapp_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsapp_number: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="e.g. 97455000000"
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-mono text-sm focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/20 transition-all"
              />
              <WhatsAppIcon className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-neutral-500">
              Used across the entire storefront for 1-click WhatsApp order generation and customer chat links.
            </p>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                <span>Customer Support Phone</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.support_phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    support_phone: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="e.g. 97455000000"
                className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-mono text-sm focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>Support Email Address</span>
              </label>
              <input
                type="email"
                value={formData.store_email}
                onChange={(e) =>
                  setFormData({ ...formData, store_email: e.target.value })
                }
                placeholder="support@mobiledeals.qa"
                className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/20 transition-all"
              />
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-1.5 pt-1">
            <label className="block font-bold uppercase tracking-wider text-neutral-300">
              Default Currency Code
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full sm:w-48 px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Announcement Bar Settings Card ── */}
      <div className="bg-neutral-900/95 border border-neutral-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Top Announcement Bar
              </h2>
              <p className="text-xs text-neutral-400">
                Configure promotional tickers shown in the header in English and Arabic.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={(e) => setAnnouncementEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
            />
            <span className="text-xs font-semibold text-neutral-300">Enabled</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English Announcement Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                English Announcements ({announcementItems.length})
              </label>
              <button
                type="button"
                onClick={() => handleAddAnnouncementItem(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {announcementItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateAnnouncementItem(idx, e.target.value, false)}
                    placeholder={`Announcement #${idx + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#8A1538]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAnnouncementItem(idx, false)}
                    className="p-2 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Arabic Announcement Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-[#ff4b77]" />
                <span>إعلانات الشريط العلوي (بالعربية)</span>
              </label>
              <button
                type="button"
                onClick={() => handleAddAnnouncementItem(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>إضافة إعلان</span>
              </button>
            </div>

            <div className="space-y-2">
              {announcementItemsAr.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    dir="rtl"
                    value={item}
                    onChange={(e) => handleUpdateAnnouncementItem(idx, e.target.value, true)}
                    placeholder={`إعلان رقم ${idx + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs text-right focus:outline-none focus:border-[#8A1538]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAnnouncementItem(idx, true)}
                    className="p-2 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Trust Badges Settings Card ── */}
      <div className="bg-neutral-900/95 border border-neutral-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800/80">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Storefront Trust Badges (Bilingual)
            </h2>
            <p className="text-xs text-neutral-400">
              Configure the 5 customer trust badges displayed at the bottom of the storefront in English and Arabic.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {trustBadges.map((badge, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold text-neutral-300 pb-1 border-b border-neutral-800/50">
                <span>Badge #{idx + 1} ({badge.icon})</span>
                <span className="text-[10px] text-neutral-500 font-normal">Icon: {badge.icon}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Title (English)</label>
                  <input
                    type="text"
                    value={badge.title}
                    onChange={(e) => handleUpdateTrustBadge(idx, "title", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#8A1538]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1 text-right">العنوان (بالعربية)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={badge.title_ar || ""}
                    onChange={(e) => handleUpdateTrustBadge(idx, "title_ar", e.target.value)}
                    placeholder="العنوان بالعربية"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs text-right focus:outline-none focus:border-[#8A1538]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Subtitle (English)</label>
                  <input
                    type="text"
                    value={badge.subtitle || ""}
                    onChange={(e) => handleUpdateTrustBadge(idx, "subtitle", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#8A1538]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1 text-right">الوصف الفرعي (بالعربية)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={badge.subtitle_ar || ""}
                    onChange={(e) => handleUpdateTrustBadge(idx, "subtitle_ar", e.target.value)}
                    placeholder="الوصف الفرعي بالعربية"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs text-right focus:outline-none focus:border-[#8A1538]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Bottom Action Bar ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between shadow-xl">
        <div>
          {saved ? (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-400 font-bold animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All store, bilingual announcements &amp; trust settings saved successfully!</span>
            </span>
          ) : (
            <span className="text-xs text-neutral-500 hidden sm:inline">
              Settings update immediately across storefront and checkout.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-[#8A1538] hover:bg-[#6c102c] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-rose-950/40 transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{loading ? "Saving Settings..." : "Save All Settings"}</span>
        </button>
      </div>
    </form>
  );
}
