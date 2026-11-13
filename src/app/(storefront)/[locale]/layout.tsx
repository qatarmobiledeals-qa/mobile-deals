import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import "@/app/globals.css";
import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-cairo",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#8A1538",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const baseUrl = "https://mobiledealsqa.com";

  return {
    title: {
      default: isArabic
        ? "موبايل ديلز قطر | أفضل عروض الهواتف والإلكترونيات والدفع عند الاستلام"
        : "Mobile Deals Qatar | Best Tech Deals & Cash on Delivery",
      template: isArabic ? "%s | موبايل ديلز قطر" : "%s | Mobile Deals Qatar",
    },
    description: isArabic
      ? "المتجر الرائد في دولة قطر للهواتف الذكية، الأجهزة اللوحية، الساعات الذكية والإكسسوارات. أسعار تنافسية، منتجات أصلية 100%، ودفع عند الاستلام في كافة مناطق قطر."
      : "Mobile Deals is Qatar's premier store for mobile phones, electronics, smartwatches, accessories and gadgets. Unbeatable prices, 100% genuine tech, Cash on Delivery nationwide.",
    keywords: isArabic
      ? [
          "موبايل ديلز قطر",
          "هواتف قطر",
          "إلكترونيات الدوحة",
          "الدفع عند الاستلام قطر",
          "عروض ايفون قطر",
          "عروض سامسونج الدوحة",
          "إكسسوارات جوال قطر",
        ]
      : [
          "Mobile Deals Qatar",
          "Mobiles Qatar",
          "Electronics Doha",
          "Cash on Delivery Qatar",
          "iPhone deals Qatar",
          "Samsung deals Doha",
          "Tech accessories Qatar",
        ],
    authors: [{ name: isArabic ? "موبايل ديلز" : "Mobile Deals" }],
    creator: "Mobile Deals Qatar",
    publisher: "Mobile Deals Qatar",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        ar: `${baseUrl}/ar`,
        "x-default": `${baseUrl}/en`,
      },
    },
    openGraph: {
      type: "website",
      locale: isArabic ? "ar_QA" : "en_QA",
      url: `${baseUrl}/${locale}`,
      siteName: isArabic ? "موبايل ديلز قطر" : "Mobile Deals Qatar",
      title: isArabic
        ? "موبايل ديلز قطر | أفضل عروض الهواتف والإلكترونيات"
        : "Mobile Deals Qatar | Best Tech Deals & Cash on Delivery",
      description: isArabic
        ? "هواتف، أجهزة لوحية، إكسسوارات أصلية في قطر مع الدفع عند الاستلام وخدمة سريعة عبر واتساب."
        : "Mobiles, electronics, accessories and lifestyle tech in Qatar with Cash on Delivery and WhatsApp ordering.",
    },
    twitter: {
      card: "summary_large_image",
      title: isArabic
        ? "موبايل ديلز قطر | أفضل عروض الهواتف"
        : "Mobile Deals Qatar | Best Tech Deals",
      description: isArabic
        ? "تسوق الهواتف والإلكترونيات في قطر مع الدفع عند الاستلام."
        : "Shop mobiles and electronics in Qatar with Cash on Delivery.",
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: "NayXTqGiSy25jSnBR2VgtRIX2MqqmzgMsyQmOQWkZek",
    },
    icons: {
      icon: [{ url: "/fav-icon.png", type: "image/png" }],
      shortcut: ["/fav-icon.png"],
      apple: [{ url: "/fav-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function StorefrontRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const isArabic = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={`${inter.variable} ${cairo.variable}`}
    >
      <body
        suppressHydrationWarning
        className={`antialiased text-neutral-900 bg-white min-h-screen flex flex-col selection:bg-[#8A1538] selection:text-white pb-14 md:pb-0 ${
          isArabic ? "font-cairo font-arabic" : "font-sans"
        }`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

