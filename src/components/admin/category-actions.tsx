"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCategoryAction } from "@/app/actions/admin";
import { Trash2, Loader2 } from "lucide-react";

interface CategoryActionsProps {
  id?: string;
  categoryId?: string;
  categoryName?: string;
}

export function CategoryActions({
  id,
  categoryId,
  categoryName,
}: CategoryActionsProps) {
  const targetId = id || categoryId || "";
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!targetId) return;
    if (!confirm(`Are you sure you want to delete this category?`)) return;
    setLoading(true);
    await deleteCategoryAction(targetId);
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
      title="Delete category"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
