import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "mobile-deals/products";

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No file was uploaded." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, error: "Cloudinary Cloud Name is missing in .env.local" },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const mimeType = file.type || "image/jpeg";
    const fileBlob = new Blob([arrayBuffer], { type: mimeType });

    const uploadFormData = new FormData();
    uploadFormData.append("file", fileBlob, file.name || "upload.jpg");

    if (uploadPreset) {
      uploadFormData.append("upload_preset", uploadPreset);
      if (folder) uploadFormData.append("folder", folder);
    } else if (apiKey && apiSecret) {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

      uploadFormData.append("api_key", apiKey);
      uploadFormData.append("timestamp", String(timestamp));
      uploadFormData.append("signature", signature);
      uploadFormData.append("folder", folder);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Cloudinary API Key or API Secret is missing in .env.local",
        },
        { status: 500 }
      );
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
      console.error("[Cloudinary API Route Upload Error]", data);
      return NextResponse.json(
        {
          success: false,
          error:
            data.error?.message ||
            "Cloudinary rejected the upload. Check API key permissions or create an upload preset in Cloudinary.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
      public_id: data.public_id || null,
    });
  } catch (err: unknown) {
    console.error("[Upload API Route Exception]", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Upload failed" },
      { status: 500 }
    );
  }
}
