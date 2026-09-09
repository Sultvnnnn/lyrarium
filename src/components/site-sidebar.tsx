"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PanelLeft,
  PanelLeftClose,
  Plus,
  Info,
  HelpCircle,
  Music,
  Users,
  BarChart2,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      {/* Mobile hamburger button (visible only on small screens) */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
          className="flex size-10 items-center justify-center border border-border bg-background text-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <PanelLeft size={16} strokeWidth={1} />
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between border-r border-border bg-muted/40 transition-all duration-300 md:static shrink-0 ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Section */}
        <div className="flex flex-col p-4">
          {/* Logo & Collapse toggle */}
          <div className="flex items-center justify-between pb-6 pt-1">
            <Link
              href="/"
              className="flex items-center gap-3 overflow-hidden"
              onClick={() => setMobileOpen(false)}
            >
              <Logo />
              {!collapsed && (
                <span className="text-subheading font-light tracking-[-0.018em] text-foreground">
                  Lyrarium
                </span>
              )}
            </Link>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden md:flex size-8 items-center justify-center border border-border text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              {collapsed ? (
                <PanelLeft size={16} strokeWidth={1} />
              ) : (
                <PanelLeftClose size={16} strokeWidth={1} />
              )}
            </button>

            {/* Mobile close toggle */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              className="flex md:hidden size-8 items-center justify-center border border-border text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <X size={16} strokeWidth={1} />
            </button>
          </div>

          {/* New / Add Action Button (+ Add Song like + New Chat in photo) */}
          <div className="my-2">
            <Link
              href="/add"
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center justify-center gap-2 border border-border bg-background py-2.5 text-body-sm font-light text-foreground transition-all hover:border-accent hover:text-accent ${
                collapsed ? "px-2" : "px-4"
              }`}
              title="Add Song"
            >
              <Plus size={16} strokeWidth={1} className="shrink-0" />
              {!collapsed && (
                <span className="truncate">Add Song</span>
              )}
            </Link>
          </div>

          {/* Nav Categories */}
          <nav className="mt-6 flex flex-col gap-6">
            {/* Category 1: Archive */}
            <div>
              {!collapsed ? (
                <div className="flex items-center justify-between px-1 text-caption uppercase text-muted-foreground">
                  <span>Archive</span>
                  <span
                    title="Lyrarium editorial archive"
                    className="cursor-help hover:text-accent"
                  >
                    <Info size={14} strokeWidth={1} />
                  </span>
                </div>
              ) : (
                <div className="flex justify-center text-caption uppercase text-muted-foreground">
                  <span>//</span>
                </div>
              )}

              <div className="mt-2 flex flex-col gap-1">
                <Link
                  href="/#collection"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-2 text-body-sm font-light text-foreground transition-colors hover:text-accent ${
                    collapsed ? "justify-center px-1" : "px-2"
                  }`}
                  title="Collection"
                >
                  <Music size={16} strokeWidth={1} className="shrink-0" />
                  {!collapsed && <span>Collection</span>}
                </Link>
              </div>
            </div>

            {/* Category 2: Explore */}
            <div>
              {!collapsed ? (
                <div className="flex items-center justify-between px-1 text-caption uppercase text-muted-foreground">
                  <span>Explore</span>
                </div>
              ) : (
                <div className="flex justify-center text-caption uppercase text-muted-foreground">
                  <span>//</span>
                </div>
              )}

              <div className="mt-2 flex flex-col gap-1">
                <Link
                  href="/#artists"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-2 text-body-sm font-light text-foreground transition-colors hover:text-accent ${
                    collapsed ? "justify-center px-1" : "px-2"
                  }`}
                  title="Artists Index"
                >
                  <Users size={16} strokeWidth={1} className="shrink-0" />
                  {!collapsed && <span>Artists</span>}
                </Link>

                <Link
                  href="/#stats"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-2 text-body-sm font-light text-foreground transition-colors hover:text-accent ${
                    collapsed ? "justify-center px-1" : "px-2"
                  }`}
                  title="Archive Stats"
                >
                  <BarChart2 size={16} strokeWidth={1} className="shrink-0" />
                  {!collapsed && <span>Stats</span>}
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom Section: Help & Theme */}
        <div className="border-t border-border p-4 flex flex-col gap-2">
          {/* Help Button */}
          <button
            onClick={() => setShowHelp(true)}
            className={`flex items-center gap-3 py-2 text-body-sm font-light text-muted-foreground hover:text-accent transition-colors ${
              collapsed ? "justify-center px-1" : "px-2"
            }`}
            title="Help & Info"
          >
            <HelpCircle size={16} strokeWidth={1} className="shrink-0" />
            {!collapsed && <span>Help</span>}
          </button>

          {/* Theme Toggle Row */}
          <div
            className={`flex items-center gap-3 py-1 ${
              collapsed ? "justify-center" : "justify-between px-2"
            }`}
          >
            {!collapsed && (
              <span className="text-caption uppercase text-muted-foreground">
                Theme
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-md border border-border bg-background p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <p className="text-caption uppercase text-muted-foreground">
                About // Lyrarium
              </p>
              <button
                onClick={() => setShowHelp(false)}
                className="text-foreground hover:text-accent"
                aria-label="Close"
              >
                <X size={16} strokeWidth={1} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-body-sm font-light text-foreground">
              <p>
                Lyrarium adalah arsip lirik dengan estetika editorial poster.
              </p>
              <p className="text-muted-foreground">
                Gunakan kotak pencarian di halaman utama untuk mencari lagu
                berdasarkan judul, nama artis, atau potongan lirik.
              </p>
              <p className="text-muted-foreground">
                Tekan <kbd className="border border-border px-1">Enter</kbd> untuk
                memulai pencarian.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="border border-foreground bg-foreground px-4 py-2 text-caption uppercase text-background hover:border-accent hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
