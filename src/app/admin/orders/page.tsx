import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderTableClient } from "@/components/admin/order-table-client";
import { Order } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  const orders = (data as Order[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Cash on Delivery (COD) Orders
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 font-medium">
          Manage Qatar customer orders, update dispatch pipelines, contact via WhatsApp, and print invoices.
        </p>
      </div>

      <OrderTableClient initialOrders={orders} />
    </div>
  );
}
