import React from "react";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { AdminNav } from "@/components/admin/admin-nav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Admin Portal | Mobile Deals Qatar",
  description: "Backoffice management portal for Mobile Deals Qatar.",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <body className="font-sans antialiased text-neutral-900 bg-neutral-950 min-h-screen">
        <AdminNav>{children}</AdminNav>
      </body>
    </html>
  );
}
