import React, { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data";
import { Logo } from "@/components/ui/logo";
import {
  CheckCircle2,
  Truck,
  MapPin,
  ArrowRight,
  Package,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ClearCartOnSuccess } from "@/components/store/clear-cart-on-success";

interface OrderSuccessPageProps {
  params: Promise<{
    ref: string;
  }>;
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { ref } = await params;
  const settings = await getSiteSettings();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_reference", ref)
    .maybeSingle();

  const whatsappCleanNumber = (settings.whatsapp_number || "+97455000000").replace(
    /[^\d]/g,
    ""
  );

  const whatsappConfirmUrl = `https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
    `Hello Mobile Deals 👋\nI just placed a Cash on Delivery order with reference #${ref}.\nPlease confirm my dispatch status.`
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60">
      <Suspense fallback={null}>
        <ClearCartOnSuccess />
      </Suspense>
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-neutral-600 hover:text-[#8A1538]"
          >
            ← Return to Store
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 md:py-16 w-full">
        {/* Success Header Card */}
        <div className="text-center bg-white rounded-3xl border border-neutral-200/90 p-8 sm:p-10 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Thank You!
            </h1>
            <p className="text-base text-neutral-700 font-semibold">
              Your Cash on Delivery order has been successfully placed.
            </p>
          </div>

          <div className="inline-block px-4 py-2 rounded-xl bg-neutral-100 border border-neutral-200 font-mono text-xs sm:text-sm font-bold text-neutral-800">
            Order Reference: <span className="text-[#8A1538]">{ref}</span>
          </div>

          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            Our Qatar delivery team will reach out via call or WhatsApp prior to dispatch to arrange safe delivery.
          </p>

          {/* WhatsApp Fast Confirmation CTA */}
          <div className="pt-2">
            <a
              href={whatsappConfirmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span>Confirm Faster on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Order Details Details */}
        {order && (
          <div className="mt-8 bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-[#8A1538]" />
              Order Summary
            </h2>

            {/* Items */}
            <div className="divide-y divide-neutral-100 text-xs sm:text-sm">
              {order.order_items?.map((item: { id: string; product_name: string; variant_name: string | null; quantity: number; price: number; total_price: number }) => (
                <div key={item.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-neutral-800">
                      {item.product_name}
                    </span>
                    {item.variant_name && (
                      <span className="text-neutral-400 text-xs block">
                        Variant: {item.variant_name}
                      </span>
                    )}
                    <span className="text-neutral-500 text-xs block">
                      Qty: {item.quantity} × QAR {item.price.toLocaleString()}
                    </span>
                  </div>
                  <span className="font-bold text-neutral-900">
                    QAR {item.total_price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>QAR {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Qatar Delivery</span>
                <span className={`font-semibold ${Number(order.delivery_fee) === 0 ? "text-emerald-600" : "text-neutral-900 font-mono"}`}>
                  {Number(order.delivery_fee) === 0 ? "FREE" : `QAR ${Number(order.delivery_fee).toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-[#8A1538] pt-2 border-t border-neutral-100">
                <span>Total Due at Doorstep (COD)</span>
                <span>QAR {order.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Customer & Address */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-neutral-800">
                <MapPin className="w-4 h-4 text-[#8A1538]" />
                <span>Delivery Recipient</span>
              </div>
              <p className="text-neutral-700">
                <strong>{order.customer_name}</strong> ({order.customer_phone})
              </p>
              <p className="text-neutral-600">
                {order.area}
                {order.zone ? `, Zone ${order.zone}` : ""}
                {order.street ? `, Street ${order.street}` : ""}
                {order.building ? `, Villa/Bldg ${order.building}` : ""}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8A1538] hover:underline"
          >
            <span>Continue Shopping at Mobile Deals</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
