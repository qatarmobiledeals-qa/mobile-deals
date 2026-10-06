"use client";

import React, { useState } from "react";
import { seedInitialDataAction } from "@/app/actions/admin";
import { Database, Loader2, CheckCircle2 } from "lucide-react";

export function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSeed = async () => {
    if (!confirm("Populate database with the 10 Qatar tech categories and sample deals?")) {
      return;
    }
    setLoading(true);
    const res = await seedInitialDataAction();
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } else {
      alert("Error seeding data: " + res.error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSeed}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#8A1538] hover:bg-[#700f2c] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Syncing Database...</span>
        </>
      ) : success ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Database Populated!</span>
        </>
      ) : (
        <>
          <Database className="w-4 h-4 text-[#F59E0B]" />
          <span>Populate Initial 10 Categories &amp; Deals</span>
        </>
      )}
    </button>
  );
}
