"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Home, Disc, Users, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Home", num: "01" },
  { href: "/songs", label: "Songs archive", num: "02" },
  { href: "/artist", label: "Artist index", num: "03" },
  { href: "/add", label: "Add a song", num: "04" },
  { href: "/artist/add", label: "Add an artist", num: "05" },
  { href: "/edit", label: "Edit archive", num: "06" },
  { href: "/changelog", label: "Archive log", num: "07" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      document.body.setAttribute("data-menu-open", "true");
      window.dispatchEvent(
        new CustomEvent("lyrarium-menu-toggle", { detail: { open: true } })
      );
    } else {
      document.body.removeAttribute("data-menu-open");
      window.dispatchEvent(
        new CustomEvent("lyrarium-menu-toggle", { detail: { open: false } })
      );
    }
    return () => {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-menu-open");
    };
  }, [open]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      {/* Top Header: responsive px, clean and unobscured */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3.5 md:py-4">
        <Link
          href="/"
          className="group flex items-center gap-3 sm:gap-4 text-foreground"
          onClick={() => setOpen(false)}
        >
          <Logo />

          <div className="flex items-center">
            <span className="text-subheading font-light tracking-[-0.018em]">
              Lyrarium
            </span>

            <div className="hidden sm:grid grid-cols-[0fr] transition-[grid-template-columns] duration-500 ease-out group-hover:grid-cols-[1fr]">
              <div className="overflow-hidden">
                <span className="whitespace-nowrap text-subheading font-light text-muted-foreground group-hover:text-accent">
                  &nbsp;// Every word, preserved.
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Desktop Controls (Add + ThemeToggle + Menu) */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/add"
            aria-label="Add song"
            className="flex size-8 items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <Plus size={16} strokeWidth={1} />
          </Link>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="border border-foreground bg-foreground text-background px-6 py-3 text-body transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            Menu
          </button>
        </div>

        {/* Mobile Header Right Controls: ThemeToggle only (Navigation is handled by Bottom Bar) */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Fullscreen Overlay Menu: z-[70] completely covers the regular header, page, and bottom bar */}
      <div
        className={`fixed inset-0 z-[70] flex flex-col justify-between bg-navy-ink px-4 sm:px-6 md:px-8 py-3.5 md:py-4 text-bone-white transition-transform duration-500 ease-in-out dark:bg-bone-white dark:text-navy-ink ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Overlay Internal Header: fully self-contained with close button */}
        <div className="flex items-center justify-between border-b border-charcoal-scale pb-3.5 md:pb-4 dark:border-ash shrink-0">
          <Link
            href="/"
            className="group flex items-center gap-3 sm:gap-4 text-bone-white dark:text-navy-ink"
            onClick={() => setOpen(false)}
          >
            <Logo inverted={true} />

            <div className="flex items-center">
              <span className="text-subheading font-light tracking-[-0.018em]">
                Lyrarium
              </span>

              <span className="hidden sm:inline text-subheading font-light text-signal-yellow dark:text-magenta-bloom">
                &nbsp;// Every word, preserved.
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle inverted={true} />

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="border border-bone-white bg-bone-white text-navy-ink dark:border-navy-ink dark:bg-navy-ink dark:text-bone-white px-4 py-2 text-caption md:px-6 md:py-3 md:text-body transition-colors hover:border-signal-yellow hover:bg-signal-yellow hover:text-navy-ink dark:hover:border-magenta-bloom dark:hover:bg-magenta-bloom dark:hover:text-bone-white cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Navigation Links with Staggered Slide */}
        <nav className="flex flex-col overflow-y-auto py-4 md:py-6">
          {links.map((l, i) => (
            <Link
              key={l.num}
              href={l.href}
              onClick={() => setOpen(false)}
              className="group flex items-baseline gap-4 md:gap-6 border-t border-charcoal-scale py-2.5 sm:py-3 md:py-[1.4vh] last:border-b dark:border-ash"
            >
              <span className="text-caption uppercase text-ash dark:text-graphite font-mono">
                {l.num}
              </span>
              <span
                className={`inline-block text-[clamp(1.5rem,min(5vw,6.2vh),4.75rem)] font-light leading-[1.1] tracking-[-0.03em] transition-[color,opacity,transform] duration-500 group-hover:translate-x-4 group-hover:text-signal-yellow dark:group-hover:text-magenta-bloom ${
                  open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${150 + i * 80}ms` }}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Overlay Footer */}
        <div className="flex items-end justify-between pt-4 shrink-0">
          <p className="text-caption uppercase text-ash dark:text-graphite">
            © 2026 Lyrarium
          </p>
          <p className="text-caption uppercase text-ash dark:text-graphite">
            Every word speaks
          </p>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (md:hidden) — strictly icons only, zero text */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch h-14 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
      >
        {/* 1. Home */}
        <Link
          href="/"
          aria-label="Home"
          className={`flex-1 flex items-center justify-center transition-colors relative ${
            pathname === "/"
              ? "text-accent"
              : "text-muted-foreground hover:text-accent active:text-accent"
          }`}
        >
          {pathname === "/" && (
            <span className="absolute top-0 left-3 right-3 h-[2px] bg-accent" />
          )}
          <Home size={16} strokeWidth={1} />
        </Link>

        {/* 2. Songs Archive */}
        <Link
          href="/songs"
          aria-label="Songs archive"
          className={`flex-1 flex items-center justify-center transition-colors relative ${
            pathname === "/songs" || pathname.startsWith("/lyrics")
              ? "text-accent"
              : "text-muted-foreground hover:text-accent active:text-accent"
          }`}
        >
          {(pathname === "/songs" || pathname.startsWith("/lyrics")) && (
            <span className="absolute top-0 left-3 right-3 h-[2px] bg-accent" />
          )}
          <Disc size={16} strokeWidth={1} />
        </Link>

        {/* 3. Artist Index */}
        <Link
          href="/artist"
          aria-label="Artist index"
          className={`flex-1 flex items-center justify-center transition-colors relative ${
            pathname.startsWith("/artist") && pathname !== "/artist/add"
              ? "text-accent"
              : "text-muted-foreground hover:text-accent active:text-accent"
          }`}
        >
          {pathname.startsWith("/artist") && pathname !== "/artist/add" && (
            <span className="absolute top-0 left-3 right-3 h-[2px] bg-accent" />
          )}
          <Users size={16} strokeWidth={1} />
        </Link>

        {/* 4. Add a Song */}
        <Link
          href="/add"
          aria-label="Add a song"
          className={`flex-1 flex items-center justify-center transition-colors relative ${
            pathname === "/add" || pathname === "/artist/add"
              ? "text-accent"
              : "text-muted-foreground hover:text-accent active:text-accent"
          }`}
        >
          {(pathname === "/add" || pathname === "/artist/add") && (
            <span className="absolute top-0 left-3 right-3 h-[2px] bg-accent" />
          )}
          <Plus size={16} strokeWidth={1} />
        </Link>

        {/* 5. Menu Overlay Toggle */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className={`flex-1 flex items-center justify-center transition-colors relative ${
            open
              ? "text-accent"
              : "text-muted-foreground hover:text-accent active:text-accent"
          }`}
        >
          {open && (
            <span className="absolute top-0 left-3 right-3 h-[2px] bg-accent" />
          )}
          {open ? <X size={16} strokeWidth={1} /> : <Menu size={16} strokeWidth={1} />}
        </button>
      </nav>
    </>
  );
}
