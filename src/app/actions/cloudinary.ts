"use server";

import crypto from "crypto";
import { extractCloudinaryPublicId } from "@/lib/cloudinary";

export interface CloudinarySignatureResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/**
 * Server-side upload action to upload images to Cloudinary securely.
 */
export async function uploadImageServerAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "mobile-deals/products";

    if (!file || typeof file === "string") {
      return { success: false, error: "No file was selected for upload." };
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey =
      process.env.CLOUDINARY_API_KEY ||
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset =
      process.env.CLOUDINARY_UPLOAD_PRESET ||
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      return {
        success: false,
        error: "Cloudinary Cloud Name is missing in .env.local",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const mimeType = file.type || "image/jpeg";
    const fileBlob = new Blob([arrayBuffer], { type: mimeType });

    const uploadFormData = new FormData();
    uploadFormData.append("file", fileBlob, file.name || "upload.jpg");

    // If an upload preset is configured, use it (works unconditionally)
    if (uploadPreset) {
      uploadFormData.append("upload_preset", uploadPreset);
      if (folder) uploadFormData.append("folder", folder);
    } else if (apiKey && apiSecret) {
      // Signed upload using API Key & Secret
      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

      uploadFormData.append("api_key", apiKey);
      uploadFormData.append("timestamp", String(timestamp));
      uploadFormData.append("signature", signature);
      uploadFormData.append("folder", folder);
    } else {
      return {
        success: false,
        error: "Cloudinary API Key or API Secret is missing in .env.local",
      };
    }

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data.error?.message ||
          "Cloudinary rejected the upload. Check API key permissions or create an upload preset in Cloudinary."
      );
    }

    return { success: true, url: data.secure_url };
  } catch (err: unknown) {
    console.error("[Cloudinary Server Upload Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Generates a secure signature for direct browser-to-Cloudinary uploads.
 */
export async function getCloudinaryUploadSignature(
  folder = "mobile-deals/products"
): Promise<{ success: boolean; data?: CloudinarySignatureResult; error?: string }> {
  try {
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey =
      process.env.CLOUDINARY_API_KEY ||
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return {
        success: false,
        error: "Cloudinary credentials not configured in environment.",
      };
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    return {
      success: true,
      data: {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}


/**
 * Deletes an image from Cloudinary using Cloudinary's Destroy API.
 */
export async function deleteCloudinaryImageAction(
  urlOrPublicId: string
): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    const publicId = extractCloudinaryPublicId(urlOrPublicId);
    if (!publicId) {
      // Not a Cloudinary asset or empty
      return { success: true, result: "skipped" };
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey =
      process.env.CLOUDINARY_API_KEY ||
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("[Cloudinary Delete] Missing credentials in environment, skipping delete.");
      return { success: false, error: "Cloudinary credentials missing." };
    }

    const timestamp = Math.round(Date.now() / 1000);
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    const body = new URLSearchParams();
    body.append("public_id", publicId);
    body.append("timestamp", String(timestamp));
    body.append("api_key", apiKey);
    body.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: body,
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn("[Cloudinary Delete API Error]", data);
      return { success: false, error: data.error?.message || "Failed to destroy image" };
    }

    return { success: true, result: data.result };
  } catch (err: unknown) {
    console.error("[Cloudinary Delete Exception]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Deletes multiple images from Cloudinary concurrently.
 */
export async function deleteMultipleCloudinaryImagesAction(
  urlsOrPublicIds: (string | null | undefined)[]
): Promise<{ success: boolean; deletedCount: number }> {
  const validTargets = urlsOrPublicIds
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim());

  if (validTargets.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  const results = await Promise.allSettled(
    validTargets.map((target) => deleteCloudinaryImageAction(target))
  );

  const deletedCount = results.filter(
    (r) => r.status === "fulfilled" && r.value.success && r.value.result === "ok"
  ).length;

  return { success: true, deletedCount };
}

