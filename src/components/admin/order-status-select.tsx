"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { Loader2 } from "lucide-react";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
}

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: OrderStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as typeof currentStatus;
    setStatus(newStatus);
    setLoading(true);
    await updateOrderStatusAction(orderId, newStatus);
    router.refresh();
    setLoading(false);
  };

  const statusStyleMap: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    processing: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    shipped: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={status}
        onChange={handleChange}
        disabled={loading}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer focus:outline-none ${
          statusStyleMap[status] || "bg-neutral-900 text-neutral-300 border-neutral-700"
        }`}
      >
        <option value="pending" className="bg-neutral-900 text-amber-400">Pending</option>
        <option value="confirmed" className="bg-neutral-900 text-blue-400">Confirmed</option>
        <option value="processing" className="bg-neutral-900 text-purple-400">Processing</option>
        <option value="shipped" className="bg-neutral-900 text-cyan-400">Shipped</option>
        <option value="delivered" className="bg-neutral-900 text-emerald-400">Delivered</option>
        <option value="cancelled" className="bg-neutral-900 text-rose-400">Cancelled</option>
      </select>
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />}
    </div>
  );
}
