import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: false, // Prevents erratic browser-language redirects; preserves user explicit choice
});

export type Locale = (typeof routing.locales)[number];

