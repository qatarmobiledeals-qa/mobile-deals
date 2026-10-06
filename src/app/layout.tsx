import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#8A1538",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Mobile Deals Qatar | Best Tech Deals & Cash on Delivery",
    template: "%s | Mobile Deals Qatar",
  },
  description:
    "Mobile Deals is Qatar's premier store for mobile phones, electronics, smartwatches, accessories and gadgets. Unbeatable prices, 100% genuine tech, Cash on Delivery nationwide.",
  keywords: [
    "Mobile Deals Qatar",
    "Mobiles Qatar",
    "Electronics Doha",
    "Cash on Delivery Qatar",
    "iPhone deals Qatar",
    "Samsung deals Doha",
    "Tech accessories Qatar",
  ],
  authors: [{ name: "Mobile Deals" }],
  creator: "Mobile Deals",
  publisher: "Mobile Deals Qatar",
  metadataBase: new URL("https://mobiledealsqa.com"),
  openGraph: {
    type: "website",
    locale: "en_QA",
    url: "https://mobiledealsqa.com",
    siteName: "Mobile Deals Qatar",
    title: "Mobile Deals Qatar | Best Tech Deals & Cash on Delivery",
    description:
      "Mobiles, electronics, accessories and lifestyle tech in Qatar with Cash on Delivery and WhatsApp ordering.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobile Deals Qatar | Best Tech Deals",
    description: "Shop mobiles and electronics in Qatar with Cash on Delivery.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "NayXTqGiSy25jSnBR2VgtRIX2MqqmzgMsyQmOQWkZek",
  },
  icons: {
    icon: [
      { url: "/fav-icon.png", type: "image/png" },
    ],
    shortcut: ["/fav-icon.png"],
    apple: [
      { url: "/fav-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        suppressHydrationWarning
        className="font-sans antialiased text-neutral-900 bg-white min-h-screen flex flex-col selection:bg-[#8A1538] selection:text-white pb-14 md:pb-0"
      >
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
