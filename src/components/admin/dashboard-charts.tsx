"use client";

import React, { useState } from "react";
import { TrendingUp, Calendar, ShoppingBag, BarChart3 } from "lucide-react";

interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
}

export function DashboardCharts({
  dailyData,
  statusCounts,
}: {
  dailyData: DailyPoint[];
  statusCounts: Record<string, number>;
}) {
  const [activeMetric, setActiveMetric] = useState<"revenue" | "orders">("revenue");

  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue), 1000);
  const maxOrders = Math.max(...dailyData.map((d) => d.orders), 5);

  const statuses = [
    { key: "pending", label: "Pending", color: "bg-amber-500", text: "text-amber-400" },
    { key: "confirmed", label: "Confirmed", color: "bg-blue-500", text: "text-blue-400" },
    { key: "processing", label: "Processing", color: "bg-purple-500", text: "text-purple-400" },
    { key: "shipped", label: "Shipped", color: "bg-cyan-500", text: "text-cyan-400" },
    { key: "delivered", label: "Delivered", color: "bg-emerald-500", text: "text-emerald-400" },
    { key: "cancelled", label: "Cancelled", color: "bg-rose-500", text: "text-rose-400" },
  ];

  const totalOrdersInPipeline = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue & Sales Chart Card (2 cols) */}
      <div className="lg:col-span-2 bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#ff4b77]" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Sales &amp; Volume Trends
              </h2>
            </div>
            <p className="text-xs text-neutral-400">
              Past 7 days performance metrics
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveMetric("revenue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMetric === "revenue"
                  ? "bg-[#8A1538] text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Revenue (QAR)
            </button>
            <button
              onClick={() => setActiveMetric("orders")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMetric === "orders"
                  ? "bg-[#8A1538] text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Order Count
            </button>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-neutral-800">
          {dailyData.map((d, idx) => {
            const val = activeMetric === "revenue" ? d.revenue : d.orders;
            const max = activeMetric === "revenue" ? maxRevenue : maxOrders;
            const heightPercent = Math.max(Math.round((val / max) * 100), 8);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                {/* Tooltip on hover */}
                <span className="text-[10px] font-bold text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700 whitespace-nowrap">
                  {activeMetric === "revenue" ? `QAR ${d.revenue.toLocaleString()}` : `${d.orders} orders`}
                </span>

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 ${
                    activeMetric === "revenue"
                      ? "bg-gradient-to-t from-[#8A1538] to-[#ff4b77] group-hover:brightness-125"
                      : "bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-125"
                  }`}
                />

                {/* Date Label */}
                <span className="text-[10px] font-medium text-neutral-500 group-hover:text-neutral-300">
                  {d.date}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Live automated sync with Supabase
          </span>
          <span className="text-[11px] font-mono text-neutral-500">
            Updated just now
          </span>
        </div>
      </div>

      {/* Order Status Distribution Card (1 col) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Order Pipeline
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Distribution by dispatch status
          </p>

          {/* Progress Bar Representation */}
          <div className="h-3 w-full rounded-full bg-neutral-950 overflow-hidden flex my-5 border border-neutral-800">
            {statuses.map((st) => {
              const count = statusCounts[st.key] || 0;
              const pct = (count / totalOrdersInPipeline) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={st.key}
                  style={{ width: `${pct}%` }}
                  className={`${st.color} transition-all`}
                  title={`${st.label}: ${count}`}
                />
              );
            })}
          </div>

          {/* Status Breakdown List */}
          <div className="space-y-2.5">
            {statuses.map((st) => {
              const count = statusCounts[st.key] || 0;
              return (
                <div
                  key={st.key}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${st.color}`} />
                    <span className="text-neutral-300 font-medium">{st.label}</span>
                  </div>
                  <span className={`font-bold font-mono ${count > 0 ? st.text : "text-neutral-600"}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800/80 text-center">
          <span className="text-[11px] text-neutral-400">
            All COD Qatar orders receive WhatsApp instant confirmations
          </span>
        </div>
      </div>
    </div>
  );
}
