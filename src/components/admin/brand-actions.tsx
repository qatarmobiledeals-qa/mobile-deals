"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBrandAction, toggleBrandActiveAction } from "@/app/actions/admin";
import { Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export function BrandActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggleActive = async () => {
    setLoading(true);
    await toggleBrandActiveAction(id, isActive);
    router.refresh();
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;
    setLoading(true);
    await deleteBrandAction(id);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={handleToggleActive}
        disabled={loading}
        title={isActive ? "Disable brand" : "Enable brand"}
        className={`p-1.5 rounded-lg border transition-colors ${
          isActive
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-neutral-800 border-neutral-700 text-neutral-500 hover:bg-neutral-700"
        }`}
      >
        {isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        title="Delete Brand"
        className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
