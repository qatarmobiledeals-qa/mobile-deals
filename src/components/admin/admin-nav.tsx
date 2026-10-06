"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard,
  Package,
  Layers,
  Sparkles,
  Image as ImageIcon,
  ShoppingBag,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Wrench,
} from "lucide-react";

export function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If we are on the login page, render children directly without admin layout frame
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navLinks = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: Layers },
    { label: "Brands", href: "/admin/brands", icon: Sparkles },
    { label: "Hero Banners", href: "/admin/banners", icon: ImageIcon },
    { label: "COD Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Service Enquiries", href: "/admin/service-enquiries", icon: Wrench },
    { label: "Site Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-900 text-neutral-100 selection:bg-[#8A1538] selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-neutral-950 border-b border-neutral-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="px-2 py-0.5 bg-[#8A1538]/20 text-[#ff4b77] text-[10px] font-bold rounded-md uppercase">
            Admin
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 w-72 md:w-64 h-screen bg-neutral-950 border-r border-neutral-800/80 p-5 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Store Pill */}
          <div className="pb-4 border-b border-neutral-800/80">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Store Online (Qatar)
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-semibold">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-[#8A1538] text-white shadow-lg shadow-[#8A1538]/20 font-bold"
                      : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-5 border-t border-neutral-800/80 space-y-3">
          {/* Live Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-[#ff4b77] hover:border-[#8A1538]/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              Live Storefront
            </span>
            <span className="text-[10px] text-neutral-500">↗</span>
          </Link>

          {/* Sign Out Button */}
          <form action={adminLogoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-900/50 hover:bg-rose-500/10 border border-neutral-800/80 hover:border-rose-500/30 text-xs font-medium text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </span>
              <ShieldCheck className="w-3.5 h-3.5 opacity-50" />
            </button>
          </form>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950">
        {/* Top bar on desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-neutral-400">Control Panel</span>
            <span className="text-neutral-700">/</span>
            <span className="text-xs font-bold text-neutral-200">
              {navLinks.find((l) =>
                l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href)
              )?.label || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>View Store</span>
            </Link>

            <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-800">
              <div className="w-7 h-7 rounded-full bg-[#8A1538] flex items-center justify-center text-[11px] font-black text-white">
                AD
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-neutral-200 leading-none">
                  Admin User
                </span>
                <span className="text-[10px] text-neutral-500 font-mono leading-none">
                  admin@mobiledeals.qa
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
