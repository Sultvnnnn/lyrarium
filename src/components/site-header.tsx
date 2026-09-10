"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Home", num: "01" },
  { href: "/add", label: "Add a song", num: "02" },
  { href: "/artist/add", label: "Add an artist", num: "03" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="relative z-50 flex items-center justify-between px-8 py-4">
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
        className={`fixed inset-0 z-40 flex flex-col justify-between bg-navy-ink px-8 pt-24 pb-8 text-bone-white transition-transform duration-500 ease-in-out dark:bg-bone-white dark:text-navy-ink ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="flex flex-col">
          {links.map((l, i) => (
            <Link
              key={l.num}
              href={l.href}
              onClick={() => setOpen(false)}
              className="group flex items-baseline gap-6 border-t border-charcoal-scale py-6 last:border-b dark:border-ash"
            >
              <span className="text-caption uppercase text-ash dark:text-graphite">
                {l.num}
              </span>
              <span
                className={`text-heading font-light leading-heading tracking-[-0.023em] transition-all duration-500 group-hover:pl-4 group-hover:text-signal-yellow dark:group-hover:text-magenta-bloom md:text-display md:leading-display md:tracking-[-0.04em] ${
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
