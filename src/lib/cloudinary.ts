/**
 * Cloudinary URL transformation utilities.
 * Generates deterministic, cached URLs with automatic WebP/AVIF format and quality optimization.
 */

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dmqv61e4y";

export type ImageSize = "thumb" | "card" | "detail" | "hero_desktop" | "hero_mobile";

const TRANSFORMATION_PRESETS: Record<ImageSize, string> = {
  thumb: "c_limit,w_160,h_160,f_auto,q_auto",
  card: "c_pad,w_400,h_400,b_white,f_auto,q_auto",
  detail: "c_pad,w_800,h_800,b_white,f_auto,q_auto",
  hero_desktop: "c_fill,w_1400,h_600,f_auto,q_auto",
  hero_mobile: "c_fill,w_600,h_500,f_auto,q_auto",
};

/**
 * Transforms an image URL or Cloudinary public ID into an optimized Cloudinary delivery URL.
 * If the URL is already an external URL (e.g., Unsplash), it handles it cleanly.
 */
export function getOptimizedImageUrl(
  src: string | null | undefined,
  preset: ImageSize = "card"
): string {
  if (!src) {
    return "/images/placeholder.svg";
  }

  // If it's a Cloudinary URL already, inject transformation parameters
  if (src.includes("res.cloudinary.com")) {
    const transform = TRANSFORMATION_PRESETS[preset];
    // Check if it already has upload/ in the URL
    if (src.includes("/upload/")) {
      // Don't duplicate transformations if already present
      if (src.match(/\/upload\/[a-z]_[a-z0-9_,]+\//)) {
        return src;
      }
      return src.replace("/upload/", `/upload/${transform}/`);
    }
    return src;
  }

  // If it's a raw Cloudinary public ID (e.g. "mobile-deals/products/samsung-zfold")
  if (!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("/")) {
    const transform = TRANSFORMATION_PRESETS[preset];
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${src}`;
  }

  // If it's an external URL (e.g. Unsplash), return as-is
  return src;
}

/**
 * Extracts the Cloudinary public_id from a URL or returns the public_id if already provided.
 * Handles various Cloudinary delivery URL patterns including transformations and version tags.
 * Returns null if the URL is external (non-Cloudinary).
 */
export function extractCloudinaryPublicId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId || typeof urlOrId !== "string") return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // If it's a full Cloudinary URL
  if (trimmed.includes("cloudinary.com")) {
    const match = trimmed.match(
      /\/image\/upload\/(?:(?:[a-z]_[a-zA-Z0-9_,-]+,?)+\/)?(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/i
    );
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  }

  // If it's an external URL (http/https not on cloudinary.com), do not treat as Cloudinary
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return null;
  }

  // Raw public_id (strip extension if any)
  return trimmed.replace(/\.[a-zA-Z0-9]+$/, "");
}
