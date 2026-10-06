import React from "react";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = {
  title: "Admin Portal | Mobile Deals Qatar",
  description: "Backoffice management portal for Mobile Deals Qatar.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminNav>{children}</AdminNav>;
}
