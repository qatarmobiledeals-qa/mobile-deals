"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ServiceEnquiry, ServiceEnquiryStatus } from "@/types/database";
import {
  updateServiceEnquiryStatusAction,
  deleteServiceEnquiryAction,
} from "@/app/actions/admin";
import {
  Search,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
  User,
  Smartphone,
  ExternalLink,
  Trash2,
  Eye,
  X,
  Loader2,
  FileText,
  Calendar,
  Save,
  ShieldCheck,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface ServiceEnquiriesTableProps {
  initialEnquiries: ServiceEnquiry[];
}

export function ServiceEnquiriesTable({
  initialEnquiries = [],
}: ServiceEnquiriesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<ServiceEnquiry | null>(null);

  // Modal State for editing/viewing
  const [modalStatus, setModalStatus] = useState<ServiceEnquiryStatus>("pending");
  const [modalAdminNotes, setModalAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Prevent background page from scrolling while enquiry details modal is open
  useEffect(() => {
    if (selectedEnquiry) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedEnquiry]);

  const openDetailsModal = (enquiry: ServiceEnquiry) => {
    setSelectedEnquiry(enquiry);
    setModalStatus(enquiry.status);
    setModalAdminNotes(enquiry.admin_notes || "");
    setActionMessage(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: ServiceEnquiryStatus, notes?: string) => {
    setIsUpdating(true);
    setActionMessage(null);
    try {
      const res = await updateServiceEnquiryStatusAction(id, newStatus, notes);
      if (res.success) {
        setActionMessage("Status successfully updated!");
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry({
            ...selectedEnquiry,
            status: newStatus,
            admin_notes: notes !== undefined ? notes : selectedEnquiry.admin_notes,
          });
        }
        router.refresh();
      } else {
        setActionMessage(res.error || "Failed to update status.");
      }
    } catch (err) {
      setActionMessage((err as Error).message || "An error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service enquiry record? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteServiceEnquiryAction(id);
      if (res.success) {
        setSelectedEnquiry(null);
        router.refresh();
      } else {
        alert(res.error || "Failed to delete enquiry.");
      }
    } catch (err) {
      alert((err as Error).message || "An error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered enquiries
  const filteredEnquiries = useMemo(() => {
    return initialEnquiries.filter((enquiry) => {
      // Status Filter
      if (selectedStatus !== "all" && enquiry.status !== selectedStatus) {
        return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesRef = enquiry.reference_no?.toLowerCase().includes(q);
        const matchesName = enquiry.customer_name?.toLowerCase().includes(q);
        const matchesPhone = enquiry.customer_phone?.toLowerCase().includes(q);
        const matchesProduct = enquiry.product_name?.toLowerCase().includes(q);
        const matchesType = enquiry.service_type?.toLowerCase().includes(q);
        const matchesIssue = enquiry.issue_description?.toLowerCase().includes(q);

        if (!matchesRef && !matchesName && !matchesPhone && !matchesProduct && !matchesType && !matchesIssue) {
          return false;
        }
      }

      return true;
    });
  }, [initialEnquiries, search, selectedStatus]);

  // Counts for summary metrics
  const counts = useMemo(() => {
    return {
      total: initialEnquiries.length,
      pending: initialEnquiries.filter((e) => e.status === "pending").length,
      in_progress: initialEnquiries.filter((e) => e.status === "in_progress").length,
      completed: initialEnquiries.filter((e) => e.status === "completed").length,
      cancelled: initialEnquiries.filter((e) => e.status === "cancelled").length,
    };
  }, [initialEnquiries]);

  const tabs = [
    { key: "all", label: "All Enquiries", count: counts.total },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "in_progress", label: "In Progress", count: counts.in_progress },
    { key: "completed", label: "Completed", count: counts.completed },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  const getStatusBadge = (status: ServiceEnquiryStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Wrench className="w-3 h-3" />
            <span>In Progress</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-800 text-neutral-400">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Total Enquiries</span>
            <span className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{counts.total}</p>
          <span className="text-[10px] text-neutral-500">All recorded service requests</span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Pending Review</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{counts.pending}</p>
          <span className="text-[10px] text-neutral-500">Requires technical follow-up</span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400">In Progress</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-sky-400 mt-2">{counts.in_progress}</p>
          <span className="text-[10px] text-neutral-500">Under diagnostic or repair</span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Resolved / Completed</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{counts.completed}</p>
          <span className="text-[10px] text-neutral-500">Servicing successfully finished</span>
        </div>
      </div>

      {/* 2. Controls & Search */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {tabs.map((tab) => {
              const isCurrent = selectedStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isCurrent
                      ? "bg-[#8A1538] text-white shadow-md shadow-[#8A1538]/20"
                      : "bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isCurrent ? "bg-white/20 text-white" : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, customer, phone..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#8A1538]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Table View */}
      {filteredEnquiries.length === 0 ? (
        <div className="text-center py-16 px-4 bg-neutral-900/90 rounded-3xl border border-neutral-800">
          <Wrench className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
          <h3 className="text-base font-bold text-white">No Service Enquiries Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            {search || selectedStatus !== "all"
              ? "No enquiries matched your filter or search criteria."
              : "When customers submit requests via the /service-enquiry page, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Reference &amp; Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Service Type</th>
                  <th className="py-3.5 px-4">Product &amp; Issue</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredEnquiries.map((enquiry) => {
                  const cleanPhone = enquiry.customer_phone?.replace(/[^\d]/g, "") || "";
                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${enquiry.customer_name} 👋 Regarding your Service Enquiry #${enquiry.reference_no} for ${enquiry.product_name}:`
                  )}`;

                  const formattedDate = new Date(enquiry.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={enquiry.id}
                      className="hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                      onClick={() => openDetailsModal(enquiry)}
                    >
                      {/* Reference & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-white block">
                          #{enquiry.reference_no}
                        </span>
                        <span className="text-[10px] text-neutral-500">{formattedDate}</span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-neutral-200 block">
                          {enquiry.customer_name}
                        </span>
                        <span className="text-neutral-400 font-mono text-[11px] block">
                          {enquiry.customer_phone}
                        </span>
                      </td>

                      {/* Service Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 font-medium inline-block text-[11px]">
                          {enquiry.service_type}
                        </span>
                      </td>

                      {/* Product & Issue */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-bold text-neutral-200 block truncate">
                          {enquiry.product_name}
                          {enquiry.product_model ? ` (${enquiry.product_model})` : ""}
                        </span>
                        <p className="text-[11px] text-neutral-400 line-clamp-1">
                          {enquiry.issue_description}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={enquiry.status}
                          onChange={(e) =>
                            handleUpdateStatus(enquiry.id, e.target.value as ServiceEnquiryStatus)
                          }
                          className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-semibold focus:outline-none focus:border-[#8A1538] cursor-pointer"
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="in_progress">⚙️ In Progress</option>
                          <option value="completed">✅ Completed</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {/* Direct WhatsApp Chat */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <WhatsAppIcon className="w-4 h-4 fill-current" />
                          </a>

                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => openDetailsModal(enquiry)}
                            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(enquiry.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Delete Enquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Details Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full my-6 flex flex-col shadow-2xl overflow-hidden text-neutral-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#8A1538]/20 text-[#ff4b77]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      Service Enquiry #{selectedEnquiry.reference_no}
                    </h2>
                    {getStatusBadge(selectedEnquiry.status)}
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    Received on{" "}
                    {new Date(selectedEnquiry.created_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[70vh]">
              {actionMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionMessage}</span>
                </div>
              )}

              {/* Customer Info Card */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/90 space-y-3">
                <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#ff4b77]" />
                  <span>Customer Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[11px]">Full Name</span>
                    <span className="font-bold text-white text-sm">{selectedEnquiry.customer_name}</span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[11px]">Phone / WhatsApp</span>
                    <span className="font-mono text-neutral-200 block">{selectedEnquiry.customer_phone}</span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[11px]">Email Address</span>
                    <span className="text-neutral-200">{selectedEnquiry.customer_email || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[11px]">Preferred Contact</span>
                    <span className="text-neutral-200 font-semibold">{selectedEnquiry.preferred_contact || "WhatsApp"}</span>
                  </div>
                </div>

                {/* Quick WhatsApp Link Button */}
                <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2">
                  <a
                    href={`https://wa.me/${selectedEnquiry.customer_phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                      `Hello ${selectedEnquiry.customer_name} 👋 Regarding your Service Enquiry #${selectedEnquiry.reference_no} at Mobile Deals Qatar:`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-white" />
                    <span>Message Customer on WhatsApp</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                </div>
              </div>

              {/* Service & Product Details */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/90 space-y-3">
                <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#ff4b77]" />
                  <span>Service &amp; Device Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[11px]">Service Type</span>
                    <span className="font-bold text-amber-300 text-xs">{selectedEnquiry.service_type}</span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[11px]">Product / Device</span>
                    <span className="font-bold text-white text-xs">{selectedEnquiry.product_name}</span>
                  </div>

                  {selectedEnquiry.product_model && (
                    <div className="sm:col-span-2">
                      <span className="text-neutral-500 block text-[11px]">Model / Code / Specs</span>
                      <span className="text-neutral-300">{selectedEnquiry.product_model}</span>
                    </div>
                  )}
                </div>

                {/* Issue Description */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-1">
                  <span className="text-neutral-500 block text-[11px] font-semibold">
                    Issue Description / Customer Request:
                  </span>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 leading-relaxed whitespace-pre-wrap">
                    {selectedEnquiry.issue_description}
                  </div>
                </div>

                {/* Additional Details */}
                {selectedEnquiry.additional_details && (
                  <div className="pt-2 space-y-1">
                    <span className="text-neutral-500 block text-[11px] font-semibold">
                      Additional Notes:
                    </span>
                    <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-neutral-300 text-[11px] whitespace-pre-wrap">
                      {selectedEnquiry.additional_details}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update & Admin Notes */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/90 space-y-3">
                <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#ff4b77]" />
                  <span>Admin Status &amp; Internal Notes</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-neutral-400 block text-xs font-semibold">
                      Enquiry Status
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as ServiceEnquiryStatus)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-semibold focus:outline-none focus:border-[#8A1538]"
                    >
                      <option value="pending">⏳ Pending (Awaiting review)</option>
                      <option value="in_progress">⚙️ In Progress (Diagnosing / Repairing)</option>
                      <option value="completed">✅ Completed (Resolved &amp; Delivered)</option>
                      <option value="cancelled">❌ Cancelled (Declined / Rejected)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 block text-xs font-semibold">
                    Internal Admin Notes / Diagnosis Record
                  </label>
                  <textarea
                    rows={3}
                    value={modalAdminNotes}
                    onChange={(e) => setModalAdminNotes(e.target.value)}
                    placeholder="Add internal notes on quotes, parts ordered, customer contact history, or technician assignment..."
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      handleUpdateStatus(selectedEnquiry.id, modalStatus, modalAdminNotes)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8A1538] hover:bg-[#6c102c] text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Status &amp; Notes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(selectedEnquiry.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
