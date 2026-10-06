"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { compressImageClientSide } from "@/lib/image-compressor";
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, X, Image as ImageIcon, Sparkles } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string, publicId?: string | null) => void;
  folder?: string;
  label?: string;
}

export function ImageUploader({
  value,
  onChange,
  folder = "mobile-deals/products",
  label = "Upload Image to Cloudinary",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setCompressionInfo(null);

    try {
      // 1. Client-side compression to lightweight WebP (saves 85-95% Cloudinary quota)
      const compressed = await compressImageClientSide(file, 1000, 1000, 0.82);
      
      const compressedKb = Math.round(compressed.compressedSizeBytes / 1024);
      if (compressed.savedPercentage > 0) {
        setCompressionInfo(`Optimized: ${compressedKb} KB (${compressed.savedPercentage}% Cloudinary storage saved)`);
      }

      // 2. Upload lightweight compressed file to Cloudinary
      const formData = new FormData();
      formData.append("file", compressed.file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await response.json();

      if (!res.success || !res.url) {
        throw new Error(
          res.error ||
            "Upload failed. Please check your Cloudinary credentials or paste a direct image URL below."
        );
      }

      onChange(res.url, res.public_id || null);
    } catch (err: unknown) {
      console.error("[Cloudinary Upload Error]", err);
      setError(
        (err as Error).message ||
          "Upload failed. You can also paste an image URL directly below."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2.5">
      <label className="block font-semibold text-neutral-300 text-xs flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#ff4b77]" />
          <span>{label}</span>
        </span>
        <span className="text-[11px] text-neutral-500 font-normal">Cloudinary Media CDN</span>
      </label>

      {/* Preview if image is already set */}
      {value ? (
        <div className="relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="relative w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden shrink-0">
            <Image
              src={value}
              alt="Uploaded preview"
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Image Attached</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono truncate mt-0.5" title={value}>
              {value}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Upload Area */
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
            uploading
              ? "border-[#8A1538] bg-[#8A1538]/10"
              : "border-neutral-800 bg-neutral-900/60 hover:border-[#8A1538] hover:bg-neutral-900"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-2 py-3 flex flex-col items-center justify-center">
              <Loader2 className="w-7 h-7 text-[#ff4b77] animate-spin" />
              <span className="text-xs font-bold text-neutral-200">
                Uploading to Cloudinary CDN...
              </span>
            </div>
          ) : (
            <div className="space-y-2 py-2 flex flex-col items-center justify-center">
              <div className="w-11 h-11 rounded-2xl bg-[#8A1538]/20 text-[#ff4b77] flex items-center justify-center border border-[#8A1538]/30">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-neutral-200">
                  Click to browse &amp; upload image
                </p>
                <p className="text-[11px] text-emerald-400/90 mt-0.5 font-medium">
                  ⚡ Auto-compressed to lightweight WebP (saves Cloudinary quota)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compression Info Badge */}
      {compressionInfo && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold animate-in fade-in duration-200">
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>{compressionInfo}</span>
        </div>
      )}

      {/* Manual URL input fallback */}
      <div className="pt-0.5">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste any direct Image URL (Unsplash / Cloudinary / Web)..."
          className="w-full h-10 px-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]"
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
}
