import React from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import {
  Package,
  ShoppingBag,
  Layers,
  Banknote,
  ArrowUpRight,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  // Fetch key statistics and catalog data
  const [
    { count: productsCount, data: lowStockData },
    { count: categoriesCount, data: categoriesData },
    { count: brandsCount },
    { data: ordersData },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, price, stock, is_active", { count: "exact" })
      .lte("stock", 5)
      .eq("is_active", true)
      .limit(5),
    supabase
      .from("categories")
      .select("id, name, slug, display_order, is_active", { count: "exact" })
      .order("display_order", { ascending: true })
      .limit(6),
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const orders = ordersData || [];
  const lowStockProducts = lowStockData || [];
  const topCategories = categoriesData || [];

  // Compute Total Revenue and Status Breakdown
  const validOrders = orders.filter((o) => o.status !== "cancelled");
  const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const statusCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  orders.forEach((o) => {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    }
  });

  // Generate 7-day trend data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const dailyData = last7Days.map((dateStr) => {
    const dayOrders = orders.filter(
      (o) => o.created_at && o.created_at.slice(0, 10) === dateStr
    );
    const dayRevenue = dayOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const d = new Date(dateStr);
    const label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });

    return {
      date: label,
      revenue: dayRevenue,
      orders: dayOrders.length,
    };
  });

  const stats = [
    {
      label: "Total Store Revenue",
      value: `QAR ${totalRevenue.toLocaleString()}`,
      subtext: `${validOrders.length} successful transactions`,
      icon: Banknote,
      href: "/admin/orders",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      label: "Total Orders Placed",
      value: orders.length,
      subtext: `${pendingOrders} pending confirmation`,
      icon: ShoppingBag,
      href: "/admin/orders",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Active Products",
      value: productsCount ?? 0,
      subtext: `${categoriesCount ?? 0} categories, ${brandsCount ?? 0} brands`,
      icon: Package,
      href: "/admin/products",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Low Stock Items",
      value: lowStockProducts.length,
      subtext: lowStockProducts.length > 0 ? "Requires restock (<= 5 units)" : "All stocks healthy",
      icon: AlertTriangle,
      href: "/admin/products",
      color: lowStockProducts.length > 0
        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
        : "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Store Overview &amp; Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            Monitor real-time Qatar sales, customer COD dispatches, inventory, and promotions.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              href={stat.href}
              className="p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-lg hover:border-[#8A1538]/50 hover:bg-neutral-900 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-neutral-400">
                  {stat.label}
                </span>
                <div className={`p-2.5 rounded-2xl border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {stat.value}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    {stat.subtext}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-[#ff4b77] transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics & Pipeline Charts */}
      <DashboardCharts dailyData={dailyData} statusCounts={statusCounts} />

      {/* Bottom Grid: Recent Orders Feed + Inventory/Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 cols) */}
        <div className="lg:col-span-2 bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Recent Customer Orders
              </h2>
              <p className="text-xs text-neutral-400">
                Latest Cash on Delivery orders placed across Qatar
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#ff4b77] hover:text-[#ff7295] flex items-center gap-1 transition-colors"
            >
              <span>View All ({orders.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-neutral-950 border border-neutral-800/80">
              <ShoppingBag className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
              <p className="text-xs font-bold text-neutral-300">No orders recorded yet</p>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto mt-0.5">
                Orders placed through the storefront or WhatsApp checkout will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 uppercase font-bold text-[10px]">
                    <th className="py-3 px-3">Order Ref</th>
                    <th className="py-3 px-3">Customer &amp; Location</th>
                    <th className="py-3 px-3">Payable</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-medium text-neutral-300">
                  {orders.slice(0, 6).map((order) => {
                    const whatsappClean = order.customer_phone.replace(/[^\d]/g, "");
                    const itemsSummary = order.order_items?.map((it: { product_name: string }) => it.product_name).join(", ");

                    const statusBadgeColors: Record<string, string> = {
                      pending: "bg-amber-500/10 border-amber-500/30 text-amber-400",
                      confirmed: "bg-blue-500/10 border-blue-500/30 text-blue-400",
                      processing: "bg-purple-500/10 border-purple-500/30 text-purple-400",
                      shipped: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
                      delivered: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                      cancelled: "bg-rose-500/10 border-rose-500/30 text-rose-400",
                    };

                    return (
                      <tr key={order.id} className="hover:bg-neutral-800/40">
                        {/* Reference */}
                        <td className="py-3 px-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono font-bold text-[#ff4b77] hover:underline block"
                          >
                            {order.order_reference}
                          </Link>
                          <span className="text-[10px] text-neutral-500">
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        {/* Customer & Area */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">
                            {order.customer_name}
                          </span>
                          <span className="text-[11px] text-neutral-400">
                            📍 {order.area} {order.zone ? `(Zone ${order.zone})` : ""}
                          </span>
                        </td>

                        {/* Payable */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-white font-mono">
                            QAR {Number(order.total).toLocaleString()}
                          </span>
                          <span className="block text-[10px] text-neutral-500">
                            COD ({order.order_items?.length || 1} items)
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                              statusBadgeColors[order.status] ||
                              "bg-neutral-800 border-neutral-700 text-neutral-400"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>

                        {/* WhatsApp Action */}
                        <td className="py-3 px-3 text-right">
                          <a
                            href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
                              `Hello ${order.customer_name}, thank you for your order ${order.order_reference} at Mobile Deals Qatar! Total: QAR ${order.total}. Status: ${order.status}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-colors"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Low Stock Alerts & Catalog Quicklinks */}
        <div className="space-y-6">
          {/* Low Stock Warning Box */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Low Stock Inventory
                </h3>
              </div>
              <Link
                href="/admin/products"
                className="text-[11px] font-bold text-amber-400 hover:underline"
              >
                Manage
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-neutral-500 py-3 text-center bg-neutral-950 rounded-2xl border border-neutral-800">
                ✅ All products have healthy stock levels (&gt; 5 units).
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 max-w-[180px]">
                      <span className="font-bold text-white block truncate">
                        {prod.name}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        QAR {prod.price}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {prod.stock} left
                      </span>
                      <Link
                        href={`/admin/products`}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        title="Edit Product"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Category Catalog Stats */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">
                  Active Categories
                </h3>
              </div>
              <Link
                href="/admin/categories"
                className="text-[11px] font-bold text-[#ff4b77] hover:underline"
              >
                All Categories
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {topCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex flex-col justify-between"
                >
                  <span className="font-semibold text-neutral-300 truncate">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono mt-1">
                    order: #{cat.display_order}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
