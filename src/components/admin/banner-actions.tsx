"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBannerAction } from "@/app/actions/admin";
import { Trash2, Loader2 } from "lucide-react";

interface BannerActionsProps {
  id?: string;
  bannerId?: string;
  bannerTitle?: string;
}

export function BannerActions({ id, bannerId, bannerTitle }: BannerActionsProps) {
  const targetId = id || bannerId || "";
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!targetId) return;
    if (!confirm(`Are you sure you want to delete this banner?`)) return;
    setLoading(true);
    await deleteBannerAction(targetId);
    router.refresh();
    setLoading(false);
  };

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />;
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
      title="Delete banner"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
