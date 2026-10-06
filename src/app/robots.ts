import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/checkout",
          "/order-success/",
          "/api/",
          "/cart",
          "/search",
        ],
      },
    ],
    sitemap: "https://mobiledealsqa.com/sitemap.xml",
  };
}
