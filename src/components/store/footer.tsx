"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Category } from "@/types/database";
import { Logo } from "@/components/ui/logo";
import { Mail, MapPin, Phone, ChevronDown } from "lucide-react";

interface FooterProps {
  whatsappNumber?: string;
  storeEmail?: string;
  categories?: Category[];
}

const defaultCategories = [
  { name: "Smartphones", slug: "smartphones" },
  { name: "Earphones & Buds", slug: "earphones-buds" },
  { name: "Charger & Adapter", slug: "charger-adapter" },
  { name: "Mobile & Tablet Holder", slug: "mobile-tablet-holder" },
  { name: "Keyboard & Mouse", slug: "keyboard-mouse" },
  { name: "Watch & Straps", slug: "watch-straps" },
];

export function Footer({
  whatsappNumber = "+97455000000",
  storeEmail = "support@mobiledeals.qa",
  categories = [],
}: FooterProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const whatsappCleanNumber = whatsappNumber.replace(/[^\d]/g, "");
  const displayCategories = categories.length > 0 ? categories.slice(0, 7) : defaultCategories;

  return (
    <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4 md:col-span-3 lg:col-span-1 pb-4 md:pb-0 border-b border-neutral-800/80 md:border-none">
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl inline-block shadow-sm">
              <Logo size="md" />
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
              Mobile Deals is Qatar&apos;s premier online destination for mobile phones, electronics,
              accessories, and gadgets with guaranteed Cash on Delivery across Qatar.
            </p>
          </div>

          {/* Col 2: Categories Accordion on Mobile */}
          <div className="border-b border-neutral-800/80 md:border-none pb-3 md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection("categories")}
              className="w-full py-2 md:py-0 flex items-center justify-between text-left font-bold text-white text-sm tracking-wider uppercase md:cursor-default"
              aria-expanded={!!openSections["categories"]}
            >
              <span>Categories</span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 md:hidden ${
                  openSections["categories"] ? "rotate-180 text-white" : ""
                }`}
              />
            </button>
            <div
              className={`${
                openSections["categories"] ? "block" : "hidden"
              } md:block pt-2 md:pt-3`}
            >
              <ul className="space-y-2 text-neutral-400">
                {displayCategories.map((cat) => (
                  <li key={cat.slug || cat.name}>
                    <Link
                      href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                      className="hover:text-white transition-colors block py-0.5 md:py-0"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/shop"
                    className="text-[#8A1538] hover:text-rose-400 font-semibold transition-colors inline-block pt-1"
                  >
                    View All Categories →
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Col 3: Quick Links Accordion on Mobile */}
          <div className="border-b border-neutral-800/80 md:border-none pb-3 md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection("quickLinks")}
              className="w-full py-2 md:py-0 flex items-center justify-between text-left font-bold text-white text-sm tracking-wider uppercase md:cursor-default"
              aria-expanded={!!openSections["quickLinks"]}
            >
              <span>Quick Links</span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 md:hidden ${
                  openSections["quickLinks"] ? "rotate-180 text-white" : ""
                }`}
              />
            </button>
            <div
              className={`${
                openSections["quickLinks"] ? "block" : "hidden"
              } md:block pt-2 md:pt-3`}
            >
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors block py-0.5 md:py-0">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="hover:text-white transition-colors block py-0.5 md:py-0">
                    Shop Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/#deals" className="hover:text-white transition-colors block py-0.5 md:py-0">
                    Today&apos;s Best Deals
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-white transition-colors block py-0.5 md:py-0">
                    My Shopping Cart
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Col 4: Customer Policies Accordion on Mobile */}
          <div className="border-b border-neutral-800/80 md:border-none pb-3 md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection("customerCare")}
              className="w-full py-2 md:py-0 flex items-center justify-between text-left font-bold text-white text-sm tracking-wider uppercase md:cursor-default"
              aria-expanded={!!openSections["customerCare"]}
            >
              <span>Customer Policies</span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 md:hidden ${
                  openSections["customerCare"] ? "rotate-180 text-white" : ""
                }`}
              />
            </button>
            <div
              className={`${
                openSections["customerCare"] ? "block" : "hidden"
              } md:block pt-2 md:pt-3`}
            >
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <Link href="/privacy-policy" className="hover:text-white transition-colors block py-0.5 md:py-0">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/return-policy" className="hover:text-white transition-colors block py-0.5 md:py-0">
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link href="/service-enquiry" className="hover:text-white transition-colors block py-0.5 md:py-0">
                    Service &amp; Maintenance
                  </Link>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${whatsappCleanNumber}?text=Hello%20Mobile%20Deals%20Support`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors block py-0.5 md:py-0"
                  >
                    WhatsApp Direct Help
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Col 5: Qatar Contact Info Accordion on Mobile */}
          <div className="border-b border-neutral-800/80 md:border-none pb-3 md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection("contactInfo")}
              className="w-full py-2 md:py-0 flex items-center justify-between text-left font-bold text-white text-sm tracking-wider uppercase md:cursor-default"
              aria-expanded={!!openSections["contactInfo"]}
            >
              <span>Contact &amp; Location</span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 md:hidden ${
                  openSections["contactInfo"] ? "rotate-180 text-white" : ""
                }`}
              />
            </button>
            <div
              className={`${
                openSections["contactInfo"] ? "block" : "hidden"
              } md:block pt-2 md:pt-3`}
            >
              <div className="space-y-2.5 text-neutral-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#8A1538] shrink-0 mt-0.5" />
                  <span>Doha, State of Qatar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#8A1538] shrink-0" />
                  <span>{whatsappNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#8A1538] shrink-0" />
                  <span>{storeEmail}</span>
                </div>
                <div className="pt-2">
                  <span className="inline-block px-2.5 py-1 rounded bg-[#8A1538]/30 border border-[#8A1538]/50 text-white font-semibold text-[11px]">
                    Cash on Delivery Across Qatar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 md:mt-12 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} MOBILE DEALS. All rights reserved. Doha, Qatar.</p>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span>Crafted by</span>
            <a
              href="https://www.ekodrix.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold tracking-wide hover:text-[#F59E0B] transition-colors"
            >
              Ekodrix
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}


