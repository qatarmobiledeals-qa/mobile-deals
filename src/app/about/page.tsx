import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings, getCategories } from "@/lib/data";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { CategoryNav } from "@/components/store/category-nav";
import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import {
  ShieldCheck,
  Truck,
  Award,
  Phone,
  CheckCircle2,
  Sparkles,
  Target,
  Eye,
  BadgeCheck,
  Headphones,
  HeartHandshake,
  ArrowRight,
  MapPin,
  Clock,
  Smartphone,
  HelpCircle,
  Star,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Mobile Deals Qatar",
  description:
    "Discover Mobile Deals Qatar — your premier destination for 100% authentic smartphones, electronics, accessories, and gadgets with fast doorstep Cash on Delivery across Qatar.",
  alternates: {
    canonical: "https://mobiledealsqa.com/about",
  },
  openGraph: {
    title: "About Us | Mobile Deals Qatar",
    description:
      "Qatar's trusted online electronics store offering authentic tech, direct WhatsApp support, and Cash on Delivery.",
    url: "https://mobiledealsqa.com/about",
    type: "website",
  },
};

export const revalidate = 60;

export default async function AboutPage() {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);

  const whatsappCleanNumber = (settings.whatsapp_number || "")
    .replace(/[^0-9]/g, "")
    .replace(/^0+/, "");

  const whatsappUrl = `https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
    "Hello Mobile Deals Qatar, I would like to inquire about your products."
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <AnnouncementBar items={settings.announcement_bar?.items} />
      <MainNavbar
        whatsappNumber={settings.whatsapp_number}
        currency={settings.currency}
      />
      <CategoryNav categories={categories} />

      <main className="flex-1 w-full">
        {/* HERO BANNER SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-br from-neutral-950 via-[#3a0817] to-neutral-900 text-white py-14 sm:py-20 md:py-24 px-4">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8A1538]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8A1538]/30 border border-[#8A1538]/50 text-amber-300 font-bold text-xs uppercase tracking-widest mb-6 shadow-sm">
              <span>Qatar&apos;s Trusted Tech Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
              Authentic Smartphones &amp; Tech,{" "}
              <span className="bg-gradient-to-r from-white via-amber-200 to-[#e2839b] bg-clip-text text-transparent">
                Delivered Direct to Your Door
              </span>
            </h1>

            <p className="text-neutral-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-5 leading-relaxed font-normal">
              Mobile Deals Qatar is Doha&apos;s leading online destination for 100% genuine smartphones, premium audio, chargers, and smart accessories — backed by express Qatar-wide delivery and Cash on Delivery.
            </p>

            {/* Quick Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-10 max-w-4xl mx-auto">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center">
                <BadgeCheck className="w-6 h-6 text-amber-400 mb-1.5" />
                <span className="text-white font-bold text-sm">100% Genuine</span>
                <span className="text-neutral-400 text-xs">Sealed Factory Stock</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center">
                <Truck className="w-6 h-6 text-amber-400 mb-1.5" />
                <span className="text-white font-bold text-sm">24-48 Hours</span>
                <span className="text-neutral-400 text-xs">Fast All-Qatar Delivery</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-6 h-6 text-amber-400 mb-1.5" />
                <span className="text-white font-bold text-sm">Cash on Delivery</span>
                <span className="text-neutral-400 text-xs">Inspect Before You Pay</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center">
                <Headphones className="w-6 h-6 text-amber-400 mb-1.5" />
                <span className="text-white font-bold text-sm">WhatsApp Care</span>
                <span className="text-neutral-400 text-xs">Direct Support Team</span>
              </div>
            </div>
          </div>
        </section>

        {/* OUR STORY & WHO WE ARE */}
        <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 md:p-12 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-6 bg-[#8A1538] rounded-full inline-block" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A1538]">
                  Who We Are
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                Bringing You Tomorrow&apos;s Technology at Today&apos;s Best Prices
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                Founded with a mission to simplify tech shopping in Qatar, Mobile Deals Qatar connects gadget lovers, professionals, and families with authentic mobile devices without high retail markups or long waiting times.
              </p>
              <p className="text-neutral-600 text-sm leading-relaxed">
                From the latest <strong>Apple iPhones, Samsung Galaxy flagships, Xiaomi, OnePlus, and Google Pixel devices</strong> to essential high-speed chargers, protective cases, and wireless audio gear, every single item in our catalog is handpicked for quality and reliability.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Doha-Based Local Warehouse</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Zero Hidden Fees</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Full Official Warranty Support</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-[#8A1538]/10 via-[#8A1538]/5 to-amber-500/10 border border-[#8A1538]/20 rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#8A1538] text-white flex items-center justify-center font-black text-xl shadow-md">
                MD
              </div>
              <h3 className="font-bold text-neutral-900 text-base">
                Why Qatar Trusts Us
              </h3>
              <ul className="space-y-3 text-xs text-neutral-700">
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>100% Original Guarantee:</strong> We strictly avoid refurbished or counterfeit devices.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Express All-Qatar Coverage:</strong> Serving Doha, Al Rayyan, Al Wakrah, Lusail, Al Khor, and beyond.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Customer-First Support:</strong> Instant assistance via WhatsApp for recommendations or order status.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="max-w-5xl mx-auto px-4 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MISSION */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs hover:border-[#8A1538]/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Our Mission</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                To empower everyone in Qatar with quick access to authentic, cutting-edge smartphone technology and gadgets at competitive prices, delivered straight to their doorstep with total transparency and care.
              </p>
            </div>

            {/* VISION */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs hover:border-[#8A1538]/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Our Vision</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                To stand as Qatar&apos;s premier, most trusted online tech store, recognized for product authenticity, rapid fulfillment speed, and exceptional customer service across all municipalities.
              </p>
            </div>
          </div>
        </section>

        {/* 6 CORE PILLARS / WHY CHOOSE US */}
        <section className="bg-neutral-100/70 border-y border-neutral-200/80 py-12 sm:py-16 px-4">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A1538] bg-[#8A1538]/10 px-3 py-1 rounded-full">
                Our Core Value Pillars
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                Why Shop with Mobile Deals Qatar?
              </h2>
              <p className="text-neutral-500 text-xs sm:text-sm">
                We combine convenience, trust, and speed to provide the best shopping experience in Qatar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Pillar 1 */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-neutral-900 text-base">100% Sealed &amp; Authentic</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  All smartphones and electronics are brand new, sealed in original factory packaging, and backed by authentic manufacturer guarantees.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-neutral-900 text-base">All-Qatar Fast Shipping</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Rapid doorstep delivery within 24 to 48 hours across Doha, Al Rayyan, Al Wakrah, Al Khor, Lusail, and surrounding areas.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-neutral-900 text-base">Cash on Delivery</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  No advance payment risk. Inspect your order box at your doorstep and pay safely via Cash on Delivery when delivered.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-neutral-900 text-base">Direct WhatsApp Assistance</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Get instant answers, stock availability checks, and order help directly from our friendly Doha-based support team.
                </p>
              </div>

              {/* Pillar 5 */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-neutral-900 text-base">Best Value Pricing</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  We monitor market pricing daily to bring you top-tier smartphone deals and accessory discounts without extra surcharges.
                </p>
              </div>

              {/* Pillar 6 */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-neutral-900 text-base">Dedicated Service Support</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Need warranty assistance or repair inquiries? Submit a service request anytime through our online support portal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (4 STEPS) */}
        <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A1538] bg-[#8A1538]/10 px-3 py-1 rounded-full">
              Seamless Shopping Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              How Ordering Works
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm">
              Getting your next smartphone or gadget in Qatar is fast, safe, and hassle-free.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Step 1 */}
            <div className="relative bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2">
              <span className="absolute top-4 right-4 text-3xl font-black text-neutral-200">01</span>
              <div className="w-9 h-9 rounded-xl bg-[#8A1538] text-white flex items-center justify-center font-bold text-xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-neutral-900 text-sm">Browse &amp; Choose</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Explore our wide catalog of original smartphones, audio gear, and gadgets.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2">
              <span className="absolute top-4 right-4 text-3xl font-black text-neutral-200">02</span>
              <div className="w-9 h-9 rounded-xl bg-[#8A1538] text-white flex items-center justify-center font-bold text-xs">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-neutral-900 text-sm">Place Order</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Order directly on our site or connect with our team on WhatsApp in seconds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2">
              <span className="absolute top-4 right-4 text-3xl font-black text-neutral-200">03</span>
              <div className="w-9 h-9 rounded-xl bg-[#8A1538] text-white flex items-center justify-center font-bold text-xs">
                <Truck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-neutral-900 text-sm">Express Shipping</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Our local dispatch team delivers your package to your doorstep anywhere in Qatar.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2">
              <span className="absolute top-4 right-4 text-3xl font-black text-neutral-200">04</span>
              <div className="w-9 h-9 rounded-xl bg-[#8A1538] text-white flex items-center justify-center font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-neutral-900 text-sm">Pay Cash on Delivery</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Inspect your sealed order upon delivery and pay conveniently in cash.
              </p>
            </div>
          </div>
        </section>

        {/* FAQS & QUICK CONTACT BANNER */}
        <section className="max-w-5xl mx-auto px-4 pb-12 sm:pb-16">
          <div className="bg-gradient-to-br from-neutral-900 via-[#440b1b] to-neutral-950 text-white rounded-3xl p-6 sm:p-10 md:p-12 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#8A1538]/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Got Questions? We Are Here to Help</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Ready to Find Your Next Smartphone or Accessory Deal?
              </h3>

              <p className="text-neutral-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Whether you need advice on picking the right smartphone, checking current stock, or tracking an active order, our dedicated Doha team is just a click away.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8A1538] text-white font-bold text-xs sm:text-sm shadow-md hover:bg-[#70102d] transition-all"
                >
                  <span>Browse Shop Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md hover:bg-emerald-700 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer
        whatsappNumber={settings.whatsapp_number}
        storeEmail={settings.store_email}
        categories={categories}
      />
      <MobileBottomNav whatsappNumber={settings.whatsapp_number} />
    </div>
  );
}

