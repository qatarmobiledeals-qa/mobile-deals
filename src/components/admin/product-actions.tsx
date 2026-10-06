"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProductAction,
  toggleProductActiveAction,
} from "@/app/actions/admin";
import { Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ProductActionsProps {
  id?: string;
  productId?: string;
  slug?: string;
  isActive: boolean;
  productName?: string;
  onToggleSuccess?: (newStatus: boolean) => void;
  onDeleteSuccess?: (id: string) => void;
}

export function ProductActions({
  id,
  productId,
  isActive,
  productName,
  onToggleSuccess,
  onDeleteSuccess,
}: ProductActionsProps) {
  const targetId = id || productId || "";
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!targetId) return;
    setLoading(true);
    const res = await toggleProductActiveAction(targetId, isActive);
    if (res.success) {
      if (onToggleSuccess) onToggleSuccess(!isActive);
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!targetId) return;
    if (!confirm(`Are you sure you want to delete this product?`)) {
      return;
    }
    setLoading(true);
    const res = await deleteProductAction(targetId);
    if (res.success) {
      if (onDeleteSuccess) onDeleteSuccess(targetId);
      router.refresh();
    }
    setLoading(false);
  };

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />;
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`p-1.5 rounded-lg border transition-colors ${
          isActive
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-neutral-800 border-neutral-700 text-neutral-500 hover:bg-neutral-700"
        }`}
        title={isActive ? "Deactivate product" : "Activate product"}
      >
        {isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
        title="Delete product"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
