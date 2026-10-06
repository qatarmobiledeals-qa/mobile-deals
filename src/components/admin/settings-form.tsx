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
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface SettingsFormProps {
  initialSettings: SiteSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    store_name: initialSettings.store_name || "MOBILE DEALS",
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

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      shipping_charge: Math.max(0, Number(formData.shipping_charge) || 0),
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
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

            {/* Clean Input Group */}
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
              Manage store branding, official Qatar WhatsApp hotline, and customer support channels.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Store Name */}
          <div className="space-y-1.5">
            <label className="block font-bold uppercase tracking-wider text-neutral-300">
              Store Brand Name
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

      {/* ── 3. Bottom Action Bar ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between shadow-xl">
        <div>
          {saved ? (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-400 font-bold animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All store &amp; delivery settings saved successfully!</span>
            </span>
          ) : (
            <span className="text-xs text-neutral-500 hidden sm:inline">
              Changes update immediately on the customer checkout.
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
