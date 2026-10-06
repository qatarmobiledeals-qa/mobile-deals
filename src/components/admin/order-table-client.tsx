"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Order } from "@/types/database";
import { OrderStatusSelect } from "./order-status-select";
import { OrderReceiptModal } from "./order-receipt-modal";
import {
  Search,
  Filter,
  ShoppingBag,
  MapPin,
  ExternalLink,
  ChevronRight,
  Phone,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface OrderTableClientProps {
  initialOrders: Order[];
}

export function OrderTableClient({ initialOrders }: OrderTableClientProps) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      // Status Tab
      if (selectedStatus !== "all" && order.status !== selectedStatus) {
        return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesRef = order.order_reference.toLowerCase().includes(q);
        const matchesName = order.customer_name.toLowerCase().includes(q);
        const matchesPhone = order.customer_phone.toLowerCase().includes(q);
        const matchesArea = order.area.toLowerCase().includes(q);
        if (!matchesRef && !matchesName && !matchesPhone && !matchesArea) return false;
      }

      return true;
    });
  }, [initialOrders, search, selectedStatus]);

  const tabs = [
    { key: "all", label: "All Orders", count: initialOrders.length },
    { key: "pending", label: "Pending", count: initialOrders.filter((o) => o.status === "pending").length },
    { key: "confirmed", label: "Confirmed", count: initialOrders.filter((o) => o.status === "confirmed").length },
    { key: "processing", label: "Processing", count: initialOrders.filter((o) => o.status === "processing").length },
    { key: "shipped", label: "Shipped", count: initialOrders.filter((o) => o.status === "shipped").length },
    { key: "delivered", label: "Delivered", count: initialOrders.filter((o) => o.status === "delivered").length },
    { key: "cancelled", label: "Cancelled", count: initialOrders.filter((o) => o.status === "cancelled").length },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
              selectedStatus === tab.key
                ? "bg-[#8A1538] text-white shadow-md shadow-[#8A1538]/20"
                : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedStatus === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-neutral-800 text-neutral-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl shadow-lg">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ref (MD-...), name, phone, area..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#8A1538]"
          />
        </div>

        <div className="text-xs text-neutral-400 font-medium">
          Found <strong className="text-white">{filteredOrders.length}</strong> orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-neutral-900/90 rounded-3xl border border-neutral-800 shadow-xl overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShoppingBag className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
            <h3 className="text-base font-bold text-white">No orders match the criteria</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              {search ? "Try clearing your search query." : "No orders found in this status category."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase font-bold text-[10px]">
                  <th className="py-3.5 px-4">Order Reference</th>
                  <th className="py-3.5 px-4">Customer &amp; Location</th>
                  <th className="py-3.5 px-3">Items &amp; Total</th>
                  <th className="py-3.5 px-3">Update Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium text-neutral-300">
                {filteredOrders.map((order) => {
                  const whatsappClean = order.customer_phone.replace(/[^\d]/g, "");

                  return (
                    <tr key={order.id} className="hover:bg-neutral-800/40">
                      {/* Reference */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-[#ff4b77] hover:underline block text-sm"
                        >
                          {order.order_reference}
                        </Link>
                        <span className="text-[11px] text-neutral-500 block mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">
                          {order.customer_name}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono block">
                          {order.customer_phone}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#ff4b77] shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {order.area} {order.zone ? `(Zone ${order.zone})` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Total & Items */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-white font-mono text-sm block">
                          QAR {Number(order.total).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">
                          {order.order_items?.length || 1} line item(s) &bull; COD
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-3">
                        <OrderStatusSelect
                          orderId={order.id}
                          currentStatus={order.status}
                        />
                      </td>

                      {/* Quick Contact & Details */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
                              `Hello ${order.customer_name}, regarding your Mobile Deals Qatar order ${order.order_reference} (Total: QAR ${order.total}). Status: ${order.status}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-colors"
                            title="Chat with customer on WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WhatsApp</span>
                          </a>

                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
