import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  // Calibrated to exact aspect ratio of /Logo-mobile-deals.png (2103 x 748, ratio 2.811:1)
  const sizeClasses = {
    sm: "h-8 sm:h-9 w-auto",
    md: "h-10 sm:h-11 md:h-12 w-auto",
    lg: "h-13 sm:h-14 md:h-16 w-auto",
    xl: "h-16 sm:h-20 w-auto",
  };

  const pixelDimensions = {
    sm: { width: 112, height: 40 },
    md: { width: 152, height: 54 },
    lg: { width: 191, height: 68 },
    xl: { width: 236, height: 84 },
  };

  const { width, height } = pixelDimensions[size];

  return (
    <Link
      href="/"
      className={`inline-flex items-center select-none focus:outline-none transition-transform active:scale-98 hover:opacity-95 ${className}`}
      aria-label="Mobile Deals Homepage"
    >
      <Image
        src="/Logo-mobile-deals.png"
        alt="Mobile Deals"
        width={width}
        height={height}
        priority
        className={`${sizeClasses[size]} object-contain max-w-none`}
      />
    </Link>
  );
}

