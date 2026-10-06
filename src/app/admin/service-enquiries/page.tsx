import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ServiceEnquiriesTable } from "@/components/admin/service-enquiries-table";
import { ServiceEnquiry } from "@/types/database";
import { Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminServiceEnquiriesPage() {
  const supabase = createAdminClient();

  let enquiries: ServiceEnquiry[] = [];
  try {
    const { data, error } = await supabase
      .from("service_enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      enquiries = data as ServiceEnquiry[];
    }
  } catch (err) {
    console.warn("Could not fetch service enquiries from Supabase:", err);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#8A1538]/20 text-[#ff4b77]">
              <Wrench className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Service &amp; Repair Enquiries
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
            Track customer technical support tickets, diagnose device repair requests, and message clients directly on WhatsApp.
          </p>
        </div>
      </div>

      {/* Interactive Table Component */}
      <ServiceEnquiriesTable initialEnquiries={enquiries} />
    </div>
  );
}
