"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Home", num: "01" },
  { href: "/songs", label: "Songs archive", num: "02" },
  { href: "/artist", label: "Artist index", num: "03" },
  { href: "/add", label: "Add a song", num: "04" },
  { href: "/artist/add", label: "Add an artist", num: "05" },
  { href: "/edit", label: "Edit archive", num: "06" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <header className="relative z-[60] flex items-center justify-between px-8 py-4">
        <Link
          href="/"
          className={`group flex items-center gap-4 ${
            open ? "text-bone-white dark:text-navy-ink" : "text-foreground"
          }`}
          onClick={() => setOpen(false)}
        >
          <Logo inverted={open} />

          <div className="flex items-center">
            <span className="text-subheading font-light">Lyrarium</span>

            <div className="grid grid-cols-[0fr] transition-all duration-500 ease-out group-hover:grid-cols-[1fr]">
              <div className="overflow-hidden">
                <span
                  className={`whitespace-nowrap text-subheading font-light ${
                    open
                      ? "text-signal-yellow dark:text-magenta-bloom"
                      : "text-muted-foreground group-hover:text-accent"
                  }`}
                >
                  &nbsp;// Every word, preserved.
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/add"
            aria-label="Add song"
            className={`flex size-8 items-center justify-center border transition-colors ${
              open
                ? "border-bone-white text-bone-white dark:border-navy-ink dark:text-navy-ink"
                : "border-border text-foreground hover:border-accent hover:text-accent"
            }`}
          >
            <Plus size={16} strokeWidth={1} />
          </Link>

          <ThemeToggle inverted={open} />

          <button
            onClick={() => setOpen(!open)}
            className={`border px-6 py-3 text-body transition-colors ${
              open
                ? "border-bone-white bg-bone-white text-navy-ink dark:border-navy-ink dark:bg-navy-ink dark:text-bone-white"
                : "border-foreground bg-foreground text-background hover:border-accent hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      {/* Overlay: navy di light, bone-white di dark */}
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-between bg-navy-ink px-8 pt-24 pb-8 text-bone-white transition-transform duration-500 ease-in-out dark:bg-bone-white dark:text-navy-ink ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="flex flex-col overflow-y-auto">
          {links.map((l, i) => (
            <Link
              key={l.num}
              href={l.href}
              onClick={() => setOpen(false)}
              className="group flex items-baseline gap-4 md:gap-6 border-t border-charcoal-scale py-2.5 sm:py-3 md:py-[1.4vh] last:border-b dark:border-ash"
            >
              <span className="text-caption uppercase text-ash dark:text-graphite">
                {l.num}
              </span>
              <span
                className={`text-[clamp(1.625rem,min(4.8vw,6.2vh),4.75rem)] font-light leading-[1.08] tracking-[-0.03em] transition-all duration-500 group-hover:pl-4 group-hover:text-signal-yellow dark:group-hover:text-magenta-bloom ${
                  open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${150 + i * 100}ms` }}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-end justify-between">
          <p className="text-caption uppercase text-ash dark:text-graphite">
            © 2026 Lyrarium
          </p>
          <p className="text-caption uppercase text-ash dark:text-graphite">
            Every word speaks
          </p>
        </div>
      </div>
    </>
  );
}
