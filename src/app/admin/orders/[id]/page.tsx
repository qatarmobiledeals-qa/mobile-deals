import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { OrderReceiptModal } from "@/components/admin/order-receipt-modal";
import { Order } from "@/types/database";
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Truck,
  ShieldCheck,
  FileText,
  Clock,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: orderData, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (error || !orderData) {
    notFound();
  }

  const order = orderData as Order;
  const whatsappClean = order.customer_phone.replace(/[^\d]/g, "");

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    confirmed: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    processing: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    shipped: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    delivered: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    cancelled: "bg-rose-500/10 border-rose-500/30 text-rose-400",
  };

  return (
    <div className="space-y-6">
      {/* Back button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex items-center gap-3">
          <OrderReceiptModal order={order} />
          <a
            href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
              `Hello ${order.customer_name}, your Mobile Deals Qatar order (${order.order_reference}) status is currently: ${order.status.toUpperCase()}. Total payable on delivery: QAR ${order.total}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-white font-mono">
              {order.order_reference}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                statusColors[order.status] || "bg-neutral-800 text-neutral-400"
              }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-neutral-400 block font-medium">
            Cash on Delivery Total
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#ff4b77] font-mono">
            QAR {Number(order.total).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Grid: Line Items & Customer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Ordered Line Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#ff4b77]" />
              <span>Order Items ({order.order_items?.length || 0})</span>
            </h2>

            <div className="divide-y divide-neutral-800/80">
              {order.order_items?.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-800 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          fill
                          sizes="56px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <span className="text-xl">📱</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {item.product_name}
                      </h3>
                      {item.variant_name && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Variant: <span className="text-neutral-200">{item.variant_name}</span>
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">
                        Qty: {item.quantity} &times; QAR {Number(item.price).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-white text-sm">
                      QAR {Number(item.total_price).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="pt-4 border-t border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="font-mono text-neutral-200">
                  QAR {Number(order.subtotal).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Doorstep Qatar Delivery</span>
                <span className={Number(order.delivery_fee) === 0 ? "text-emerald-400 font-bold" : "text-white font-mono font-bold"}>
                  {Number(order.delivery_fee) === 0 ? "FREE DELIVERY" : `QAR ${Number(order.delivery_fee).toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-neutral-800">
                <span>Payable Amount (COD)</span>
                <span className="text-[#ff4b77] font-mono">
                  QAR {Number(order.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Customer Details & Status Pipeline */}
        <div className="space-y-6">
          {/* Dispatch Status Control */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Update Dispatch Status</span>
            </h2>

            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                Current Stage
              </label>
              <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Updating status will immediately revalidate orders across admin view.
            </p>
          </div>

          {/* Customer & Address Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#ff4b77]" />
              <span>Delivery Address &amp; Contact</span>
            </h2>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">
                  Recipient
                </span>
                <p className="font-bold text-white text-sm">{order.customer_name}</p>
                <div className="flex items-center gap-2 pt-1 font-mono text-neutral-300">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" />
                  <a href={`tel:${order.customer_phone}`} className="hover:underline">
                    {order.customer_phone}
                  </a>
                </div>
                {order.customer_email && (
                  <div className="flex items-center gap-2 font-mono text-neutral-400 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{order.customer_email}</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">
                  Qatar Address Details
                </span>
                <p className="font-semibold text-white">📍 Area: {order.area}</p>
                {order.zone && <p className="text-neutral-300">Zone: {order.zone}</p>}
                {order.street && <p className="text-neutral-300">Street: {order.street}</p>}
                {order.building && <p className="text-neutral-300">Building / Villa: {order.building}</p>}
                {order.delivery_notes && (
                  <div className="mt-2 pt-2 border-t border-neutral-800">
                    <span className="text-[10px] text-neutral-500 font-bold">Delivery Notes:</span>
                    <p className="text-amber-300 italic">{order.delivery_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
