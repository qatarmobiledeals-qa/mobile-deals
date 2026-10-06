"use client";

import React, { useState, useEffect } from "react";
import { Banner } from "@/types/database";
import { HeroBannerItem } from "./hero-banner-item";
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  Banknote,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

interface HeroSectionProps {
  banners?: Banner[];
  whatsappNumber?: string;
}

export function HeroSection({
  banners = [],
  whatsappNumber = "+97455000000",
}: HeroSectionProps) {
  // Fallback banners if database has no active banners yet
  const defaultBanners: Banner[] = [
    {
      id: "default-banner-1",
      title: "Latest Tech & Smartphone Deals in Qatar",
      highlighted_text: "Exclusive Qatar Offers",
      description:
        "Shop the newest flagships, smartwatches, earbuds and tech accessories with fast doorstep delivery across Qatar.",
      primary_cta_text: "Shop Deals",
      primary_cta_link: "/#deals",
      secondary_cta_text: "Order on WhatsApp",
      secondary_cta_link: null,
      desktop_image_url:
        "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=1400&auto=format&fit=crop&q=80",
      mobile_image_url: null,
      cloudinary_public_id: null,
      position: "hero",
      display_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "default-banner-2",
      title: "Premium Tech & Fast Delivery",
      highlighted_text: "Cash on Delivery",
      description:
        "Authentic devices, original warranty and instant WhatsApp ordering across all municipalities.",
      primary_cta_text: "Explore Deals",
      primary_cta_link: "/#deals",
      secondary_cta_text: "Order on WhatsApp",
      secondary_cta_link: null,
      desktop_image_url:
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1400&auto=format&fit=crop&q=80",
      mobile_image_url: null,
      cloudinary_public_id: null,
      position: "hero",
      display_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Active banners list
  const activeBanners =
    banners.length > 0
      ? banners.length === 1
        ? [banners[0], banners[0]]
        : banners
      : defaultBanners;

  const count = activeBanners.length;

  // Cloned array for seamless unidirectional infinite loop: [last, ...activeBanners, first]
  const slides = [activeBanners[count - 1], ...activeBanners, activeBanners[0]];

  // Index 1 corresponds to the first real banner
  const [currentIdx, setCurrentIdx] = useState(1);
  const [withTransition, setWithTransition] = useState(true);

  // Unconditional auto-slide timer: ALWAYS slides forward every 5 seconds under any condition (never paused by mouse)
  useEffect(() => {
    const timer = setInterval(() => {
      setWithTransition(true);
      setCurrentIdx((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [count]);

  // Seamless jump on transition end
  const handleTransitionEnd = () => {
    if (currentIdx >= count + 1) {
      // Reached cloned first slide -> instantly jump to real first slide (index 1)
      setWithTransition(false);
      setCurrentIdx(1);
    } else if (currentIdx <= 0) {
      // Reached cloned last slide -> instantly jump to real last slide (index count)
      setWithTransition(false);
      setCurrentIdx(count);
    }
  };

  // Re-enable transition on next frame after seamless instant jump
  useEffect(() => {
    if (!withTransition) {
      const frame = requestAnimationFrame(() => {
        setWithTransition(true);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [withTransition]);

  const handlePrev = () => {
    setWithTransition(true);
    setCurrentIdx((prev) => prev - 1);
  };

  const handleNext = () => {
    setWithTransition(true);
    setCurrentIdx((prev) => prev + 1);
  };

  // Touch swipe handling for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Calculate real active dot index (0-based)
  const activeDotIndex = (currentIdx - 1 + count) % count;

  // Trust items shown under hero (matching referral: 4 in a clean row)
  const trustFeatures = [
    { icon: Truck, line1: "Fast Delivery", line2: "Qatar" },
    { icon: Banknote, line1: "Cash on", line2: "Delivery" },
    { icon: PhoneCall, line1: "WhatsApp", line2: "Support" },
    { icon: ShieldCheck, line1: "Genuine", line2: "Products" },
  ];

  return (
    <section className="relative overflow-hidden bg-white pb-3 sm:pb-8">
      {/* 1. Hero Carousel (With mobile rounded corners and subtle side margin matching referral) */}
      <div className="px-3 sm:px-0">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full overflow-hidden rounded-2xl sm:rounded-none bg-neutral-950 group select-none shadow-sm sm:shadow-none"
        >
          {/* Unidirectional Infinite Sliding Track */}
          <div
            onTransitionEnd={handleTransitionEnd}
            className={`flex w-full ${
              withTransition ? "transition-transform duration-700 ease-in-out" : ""
            }`}
            style={{ transform: `translateX(-${currentIdx * 100}%)` }}
          >
            {slides.map((banner, idx) => (
              <div key={`${banner.id || "b"}-${idx}`} className="w-full shrink-0">
                <HeroBannerItem
                  banner={banner}
                  whatsappNumber={whatsappNumber}
                  priority={idx === 1}
                />
              </div>
            ))}
          </div>

          {/* Carousel Arrows (Desktop) */}
          {count > 1 && (
            <>
              <button
                onClick={handlePrev}
                aria-label="Previous Banner"
                className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xl active:scale-90"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={handleNext}
                aria-label="Next Banner"
                className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xl active:scale-90"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setWithTransition(true);
                      setCurrentIdx(idx + 1);
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activeDotIndex === idx
                        ? "w-5 sm:w-7 bg-[#ff4b77] sm:bg-white shadow-lg"
                        : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. 4-Column Trust Strip Under Hero (Matching Referral Structure) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="grid grid-cols-4 gap-1 sm:gap-4 text-center">
          {trustFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-1 sm:p-4 rounded-xl sm:rounded-2xl bg-transparent sm:bg-neutral-50/80 sm:border sm:border-neutral-100 transition-colors"
              >
                <div className="p-1 sm:p-2.5 rounded-xl text-[#8A1538] mb-1">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.75]" />
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-neutral-800 leading-tight">
                  <p>{item.line1}</p>
                  <p>{item.line2}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
