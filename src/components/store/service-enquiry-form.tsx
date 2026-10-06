"use client";

import React, { useState } from "react";
import {
  Wrench,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  User,
  Smartphone,
  RotateCcw,
  Check,
  BatteryCharging,
  Cpu,
  Search,
  Settings,
  HelpCircle,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

import { createServiceEnquiryAction } from "@/app/actions/admin";

interface ServiceEnquiryFormProps {
  whatsappNumber?: string;
  storeEmail?: string;
}

interface ServiceOption {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const SERVICE_TYPE_CARDS: ServiceOption[] = [
  {
    id: "Screen & Display",
    title: "Screen & Display",
    desc: "Cracked glass, OLED lines, touch issue",
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    id: "Battery & Charging",
    title: "Battery & Charging",
    desc: "Fast drain, dead battery, port repair",
    icon: <BatteryCharging className="w-5 h-5" />,
  },
  {
    id: "Hardware & Repair",
    title: "Hardware & Board",
    desc: "Water damage, speaker, camera, chip",
    icon: <Cpu className="w-5 h-5" />,
  },
  {
    id: "Product Diagnostics",
    title: "Diagnostics & Checkup",
    desc: "Complete fault detection & testing",
    icon: <Search className="w-5 h-5" />,
  },
  {
    id: "Warranty Inspection",
    title: "Warranty Inspection",
    desc: "Warranty claims & official validation",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "Spare Parts & Accessories",
    title: "Parts & Accessories",
    desc: "Original replacement parts & casing",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    id: "Other Support",
    title: "Other Inquiries",
    desc: "Custom requests & technical queries",
    icon: <HelpCircle className="w-5 h-5" />,
  },
];

const CONTACT_PREFERENCE_OPTIONS = [
  {
    value: "WhatsApp",
    label: "WhatsApp Chat",
    badge: "Instant & Recommended",
    icon: <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />,
  },
  {
    value: "Phone Call",
    label: "Direct Phone Call",
    badge: "Standard",
    icon: <Phone className="w-4 h-4 text-blue-500" />,
  },
  {
    value: "Email",
    label: "Email Reply",
    badge: "Within 24h",
    icon: <Mail className="w-4 h-4 text-neutral-500" />,
  },
];

export function ServiceEnquiryForm({
  whatsappNumber = "+97455000000",
  storeEmail = "support@mobiledeals.qa",
}: ServiceEnquiryFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceType, setServiceType] = useState("Screen & Display");
  const [productName, setProductName] = useState("");
  const [productModel, setProductModel] = useState("");
  const [contactPreference, setContactPreference] = useState("WhatsApp");
  const [issueDescription, setIssueDescription] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const [savedRefNo, setSavedRefNo] = useState<string | null>(null);

  const cleanWhatsappNumber = whatsappNumber.replace(/[^\d]/g, "");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Please enter your full name";
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      newErrors.phone = "Please enter your mobile / WhatsApp number";
    } else if (cleanPhone.length < 7) {
      newErrors.phone = "Please enter a valid phone number (minimum 7 digits)";
    }

    if (!serviceType) {
      newErrors.serviceType = "Please select a service type";
    }

    if (!productName.trim()) {
      newErrors.productName = "Please specify the device or model name";
    }

    if (!issueDescription.trim()) {
      newErrors.issueDescription = "Please describe the problem or service requirement";
    } else if (issueDescription.trim().length < 5) {
      newErrors.issueDescription = "Please provide more details (at least 5 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateWhatsAppMessage = (refCode?: string | null) => {
    const lines = [
      "Hello Mobile Deals 👋 I would like to make a *Service Enquiry*.",
      refCode ? `🔖 *Reference:* #${refCode}` : null,
      "",
      "👤 *Customer Details:*",
      `• *Name:* ${name.trim()}`,
      `• *WhatsApp / Mobile:* ${phone.trim()}`,
      email.trim() ? `• *Email:* ${email.trim()}` : null,
      `• *Preferred Contact:* ${contactPreference}`,
      "",
      "🛠️ *Service Request Details:*",
      `• *Service Type:* ${serviceType}`,
      `• *Product / Device:* ${productName.trim()}`,
      productModel.trim() ? `• *Model / Code:* ${productModel.trim()}` : null,
      "",
      "📝 *Issue / Requirement:*",
      issueDescription.trim(),
      additionalDetails.trim()
        ? `\nℹ️ *Additional Details:*\n${additionalDetails.trim()}`
        : null,
      "",
      "--------------------------",
      "📍 _Submitted via Mobile Deals Qatar Service Portal_",
    ];

    return lines.filter((line) => line !== null).join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      const errorElem = document.getElementById(`field-${firstErrorKey}`);
      if (errorElem) {
        errorElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createServiceEnquiryAction({
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        preferred_contact: contactPreference,
        service_type: serviceType,
        product_name: productName,
        product_model: productModel || null,
        issue_description: issueDescription,
        additional_details: additionalDetails || null,
      });

      const refNo = res?.referenceNo || `MD-SRV-${Math.floor(100000 + Math.random() * 900000)}`;
      setSavedRefNo(refNo);

      const message = generateWhatsAppMessage(refNo);
      const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
        message
      )}`;

      setSubmittedUrl(whatsappUrl);

      const win = window.open(whatsappUrl, "_blank");
      if (!win || win.closed || typeof win.closed === "undefined") {
        window.location.href = whatsappUrl;
      }
    } catch (err) {
      console.error("Error submitting service enquiry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setServiceType("Screen & Display");
    setProductName("");
    setProductModel("");
    setContactPreference("WhatsApp");
    setIssueDescription("");
    setAdditionalDetails("");
    setErrors({});
    setSubmittedUrl(null);
    setSavedRefNo(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* 1. High-End Top Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-neutral-950 text-white border border-neutral-800 shadow-2xl p-6 sm:p-8 md:p-10">
        {/* Background Gradients & Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8A1538]/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Qatar Device Repair &amp; Maintenance Hub</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Service Enquiry &amp; Support Request
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
              From cracked screens to battery replacements, diagnostic checks, and warranty claims — get fast, certified support with genuine parts in Qatar.
            </p>
          </div>

          {/* Quick WhatsApp Action Box (Desktop Side Card) */}
          <div className="hidden md:flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-900/80 border border-neutral-700/60 backdrop-blur-md text-center min-w-[210px] space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
              <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Direct WhatsApp</p>
              <p className="text-[11px] text-neutral-400">{whatsappNumber}</p>
            </div>
            <a
              href={`https://wa.me/${cleanWhatsappNumber}?text=Hello%20Mobile%20Deals%20Support`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white text-xs font-bold transition-transform active:scale-95 shadow-sm inline-flex items-center justify-center gap-1.5"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
              <span>Chat with Us</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Success Banner when submitted */}
      {submittedUrl && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-md animate-fade-in">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-emerald-900">
                  Enquiry Form Completed &amp; Archived!
                </h3>
                {savedRefNo && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-mono text-xs font-black">
                    Ref: #{savedRefNo}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed">
                WhatsApp should have opened with your enquiry details pre-filled. If it did not open automatically, tap the button below:
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={submittedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                  <span>Open WhatsApp Enquiry Chat</span>
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit Another Enquiry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Polished Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-8 md:p-10 space-y-8"
      >
        {/* Section 1: Service Type Selection Cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
            <span className="w-1.5 h-5 bg-[#8A1538] rounded-full inline-block" />
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              1. Select Service Category
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICE_TYPE_CARDS.map((card) => {
              const isSelected = serviceType === card.id;
              return (
                <button
                  type="button"
                  key={card.id}
                  onClick={() => {
                    setServiceType(card.id);
                    if (errors.serviceType) {
                      setErrors((prev) => ({ ...prev, serviceType: "" }));
                    }
                  }}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-[#8A1538] bg-[#8A1538]/5 ring-2 ring-[#8A1538]/10 shadow-sm"
                      : "border-neutral-200 hover:border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#8A1538] text-white"
                        : "bg-white text-neutral-600 border border-neutral-200"
                    }`}
                  >
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0 pr-5">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isSelected ? "text-[#8A1538]" : "text-neutral-900"
                      }`}
                    >
                      {card.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                      {card.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#8A1538] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {errors.serviceType && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.serviceType}</span>
            </p>
          )}
        </div>

        {/* Section 2: Customer Contact Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
            <span className="w-1.5 h-5 bg-[#8A1538] rounded-full inline-block" />
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              2. Your Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div id="field-name" className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Full Name <span className="text-[#8A1538]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g. Mohammed Al-Kuwari"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none transition-all ${
                    errors.name
                      ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-neutral-200 focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Mobile / WhatsApp Number (Numbers only) */}
            <div id="field-phone" className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Mobile / WhatsApp Number <span className="text-[#8A1538]">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "");
                    setPhone(digitsOnly);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                  placeholder="e.g. 55000000 or 33000000"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none transition-all ${
                    errors.phone
                      ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-neutral-200 focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Email Address <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] transition-all"
              />
            </div>

            {/* Preferred Contact Method Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Preferred Contact Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CONTACT_PREFERENCE_OPTIONS.map((opt) => {
                  const isSelected = contactPreference === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setContactPreference(opt.value)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                        isSelected
                          ? "border-[#8A1538] bg-[#8A1538]/5 text-[#8A1538] ring-1 ring-[#8A1538]"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {opt.icon}
                      <span className="truncate">{opt.label.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Product & Issue Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
            <span className="w-1.5 h-5 bg-[#8A1538] rounded-full inline-block" />
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              3. Device &amp; Problem Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product / Device Name */}
            <div id="field-productName" className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Device / Product Name <span className="text-[#8A1538]">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  if (errors.productName) setErrors((prev) => ({ ...prev, productName: "" }));
                }}
                placeholder="e.g. iPhone 15 Pro Max / Samsung S24 Ultra"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none transition-all ${
                  errors.productName
                    ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-neutral-200 focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]"
                }`}
              />
              {errors.productName && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.productName}</span>
                </p>
              )}
            </div>

            {/* Model / Code / Color */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Model / Storage / Color <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={productModel}
                onChange={(e) => setProductModel(e.target.value)}
                placeholder="e.g. 256GB Natural Titanium / Model A3102"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] transition-all"
              />
            </div>
          </div>

          {/* Issue / Service Requirement Description */}
          <div id="field-issueDescription" className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-800">
              Problem Description / Service Requirement <span className="text-[#8A1538]">*</span>
            </label>
            <textarea
              rows={3}
              value={issueDescription}
              onChange={(e) => {
                setIssueDescription(e.target.value);
                if (errors.issueDescription) setErrors((prev) => ({ ...prev, issueDescription: "" }));
              }}
              placeholder="Please describe the issue in detail (e.g. front screen shattered after drop, battery health 72%, device not powering on, etc.)..."
              className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none transition-all ${
                errors.issueDescription
                  ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  : "border-neutral-200 focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]"
              }`}
            />
            {errors.issueDescription && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.issueDescription}</span>
              </p>
            )}
          </div>

          {/* Additional Details */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-800">
              Additional Details / Location in Qatar <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="e.g. Need urgent service in Al Rayyan / preferred pickup time..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] transition-all"
            />
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-[#25D366]/25 transition-all cursor-pointer disabled:opacity-60"
          >
            <WhatsAppIcon className="w-5 h-5 fill-white shrink-0" />
            <span>
              {isSubmitting ? "Generating WhatsApp Enquiry..." : "Submit Enquiry & Connect on WhatsApp"}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Secure Qatar Service
            </span>
            <span>•</span>
            <span>No upfront payment required for inspection</span>
            <span>•</span>
            <span>Direct WhatsApp Support</span>
          </div>
        </div>
      </form>
    </div>
  );
}

