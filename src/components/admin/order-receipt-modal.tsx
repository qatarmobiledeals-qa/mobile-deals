"use client";

import React, { useState, useEffect } from "react";
import { Order } from "@/types/database";
import { Printer, X, FileText, CheckCircle2 } from "lucide-react";

export function OrderReceiptModal({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [receiptType, setReceiptType] = useState<"pos" | "a4">("pos");

  // Prevent background page from scrolling while modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
      >
        <Printer className="w-4 h-4 text-[#ff4b77]" />
        <span>Print Invoice / Receipt</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl my-6 flex flex-col shadow-2xl overflow-hidden text-neutral-100">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#ff4b77]" />
                <h3 className="font-bold text-white text-sm">
                  Invoice &amp; Receipt Preview ({order.order_reference})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-neutral-900 p-1 border border-neutral-800 text-[11px] font-bold">
                  <button
                    onClick={() => setReceiptType("pos")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      receiptType === "pos" ? "bg-[#8A1538] text-white" : "text-neutral-400"
                    }`}
                  >
                    POS 80mm
                  </button>
                  <button
                    onClick={() => setReceiptType("a4")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      receiptType === "a4" ? "bg-[#8A1538] text-white" : "text-neutral-400"
                    }`}
                  >
                    A4 Invoice
                  </button>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Container */}
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-neutral-950/50 flex justify-center">
              <div
                id="printable-receipt"
                className={`bg-white text-neutral-900 p-6 shadow-xl rounded-xl font-sans ${
                  receiptType === "pos" ? "w-[320px] text-xs" : "w-full max-w-lg text-sm"
                }`}
              >
                {/* Store Header */}
                <div className="text-center pb-4 border-b border-neutral-300 space-y-1">
                  <h2 className="text-base font-black tracking-tight text-[#8A1538]">
                    MOBILE DEALS QATAR
                  </h2>
                  <p className="text-[10px] text-neutral-600">
                    Doha, Qatar &bull; Tel: +974 5500 0000
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    Cash on Delivery (COD) Invoice
                  </p>
                </div>

                {/* Metadata */}
                <div className="py-3 border-b border-neutral-200 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Order Ref:</span>
                    <span className="font-mono font-bold text-neutral-900">{order.order_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Date:</span>
                    <span>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Customer:</span>
                    <span className="font-bold">{order.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Phone:</span>
                    <span className="font-mono">{order.customer_phone}</span>
                  </div>
                  <div className="flex justify-between text-left">
                    <span className="text-neutral-500">Address:</span>
                    <span className="text-right max-w-[180px]">
                      {order.area} {order.zone ? `, Zone ${order.zone}` : ""} {order.street ? `, St ${order.street}` : ""} {order.building ? `, Bldg ${order.building}` : ""}
                    </span>
                  </div>
                </div>

                {/* Item List */}
                <div className="py-3 border-b border-neutral-200 space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-neutral-400">
                    <span>Item</span>
                    <span>Total</span>
                  </div>
                  {order.order_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div className="max-w-[190px]">
                        <p className="font-bold text-neutral-900 leading-tight">
                          {item.product_name}
                        </p>
                        {item.variant_name && (
                          <p className="text-[10px] text-neutral-500">{item.variant_name}</p>
                        )}
                        <p className="text-[10px] text-neutral-500">
                          {item.quantity} x QAR {Number(item.price).toLocaleString()}
                        </p>
                      </div>
                      <span className="font-bold font-mono text-neutral-900">
                        QAR {Number(item.total_price).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-3 border-b border-neutral-200 space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal:</span>
                    <span>QAR {Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Qatar Delivery:</span>
                    <span className={Number(order.delivery_fee) === 0 ? "text-emerald-700 font-bold" : "font-mono font-bold text-neutral-900"}>
                      {Number(order.delivery_fee) === 0 ? "FREE" : `QAR ${Number(order.delivery_fee).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-neutral-900 pt-1 border-t border-neutral-200">
                    <span>Total Payable (COD):</span>
                    <span className="text-[#8A1538]">QAR {Number(order.total).toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 text-center text-[10px] text-neutral-500 space-y-0.5">
                  <p className="font-semibold">Thank you for shopping with Mobile Deals!</p>
                  <p>For warranty or exchange inquiries: +974 5500 0000</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-neutral-800 flex items-center justify-end gap-3 bg-neutral-950">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-[#8A1538] hover:bg-[#6c102c] text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
