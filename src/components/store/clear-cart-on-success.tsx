"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";

export function ClearCartOnSuccess() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const clearedRef = useRef(false);

  useEffect(() => {
    const isDirect = searchParams.get("direct") === "1";
    // Only clear the shopping cart if this was a cart checkout, not a direct single-item buy
    if (!clearedRef.current && !isDirect) {
      clearedRef.current = true;
      clearCart();
    }
  }, [clearCart, searchParams]);

  return null;
}
