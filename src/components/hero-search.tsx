"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Mic, Sparkles, ShieldCheck, X } from "lucide-react";
import type { HeroItem } from "@/components/lyric-poster";

type HeroSearchProps = {
  items: HeroItem[];
  initialQuery?: string;
  artist?: string;
};

export function HeroSearch({ items, initialQuery, artist }: HeroSearchProps) {
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState(initialQuery ?? "");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rotasi lirik secara random tiap 6 detik
  useEffect(() => {
    if (items.length < 2) return;
    const interval = setInterval(() => {
      setIndex((prev) => {
        let next = Math.floor(Math.random() * items.length);
        if (next === prev) next = (next + 1) % items.length;
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  const currentItem = items[index];

  const handleRandomLine = () => {
    if (!items.length) return;
    const randomPick = items[Math.floor(Math.random() * items.length)];
    if (inputRef.current) {
      inputRef.current.value = randomPick.line;
      setQuery(randomPick.line);
      inputRef.current.focus();
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setQuery("");
  };

  return (
    <section className="flex flex-col items-center justify-center pt-8 pb-12 px-4 md:px-8">
      {/* 1. Animated Heading Lirik Random (Framer Motion) */}
      <div className="mb-8 min-h-[140px] w-full flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {currentItem && (
            <motion.div
              key={`${currentItem.id}-${currentItem.line}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              <Link
                href={`/lyrics/${currentItem.id}`}
                className="group inline-block"
              >
                <p className="mb-3 text-caption uppercase text-muted-foreground tracking-wider">
                  {currentItem.title} — {currentItem.artist}
                </p>
                <h1 className="pb-1 text-heading-sm md:text-heading font-light leading-heading tracking-[-0.023em] text-foreground transition-colors group-hover:text-accent">
                  “{currentItem.line}”
                </h1>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Hero Search Box Card (seperti foto referensi) */}
      <form
        action="/"
        method="get"
        className="w-full max-w-2xl"
      >
        {artist && <input type="hidden" name="artist" value={artist} />}

        <div className="rounded-[24px] border border-border bg-muted/30 p-5 transition-all focus-within:border-accent hover:border-accent/60">
          {/* Top: Textarea Search Input */}
          <div className="relative">
            <textarea
              ref={inputRef}
              name="q"
              rows={2}
              defaultValue={initialQuery ?? ""}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, artist, or lyrics..."
              className="w-full resize-none bg-transparent pr-8 text-body font-light text-foreground placeholder:text-muted-foreground focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />

            {/* Tombol Clear jika ada teks */}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear input"
                className="absolute top-1 right-1 flex size-6 items-center justify-center text-muted-foreground hover:text-accent transition-colors"
              >
                <X size={14} strokeWidth={1} />
              </button>
            )}
          </div>

          {/* Bottom: Toolbar di dalam search box */}
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-border/50">
            {/* Left Button: Pill Action (Random Line) */}
            <button
              type="button"
              onClick={handleRandomLine}
              className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-caption uppercase text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <Sparkles size={16} strokeWidth={1} />
              <span>Random Line</span>
            </button>

            {/* Right: Mic & Submit Arrow */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Mic input"
                title="Voice search (simulated)"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-accent transition-colors"
              >
                <Mic size={16} strokeWidth={1} />
              </button>

              <button
                type="submit"
                aria-label="Search"
                className="flex size-9 items-center justify-center rounded-full bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ArrowUp size={16} strokeWidth={1} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter status & Clear filter link */}
        {(initialQuery || artist) && (
          <div className="mt-4 flex items-center justify-between px-2 text-caption uppercase text-muted-foreground">
            <span>
              Filtering: {initialQuery && `"${initialQuery}"`} {artist && `(${artist})`}
            </span>
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-accent underline"
            >
              <X size={12} strokeWidth={1} /> Reset Filter
            </Link>
          </div>
        )}

        {/* Bottom subtle status badge (seperti HIPAA Private di foto) */}
        <div className="mt-8 flex items-center justify-center gap-2 text-caption uppercase text-muted-foreground">
          <ShieldCheck size={14} strokeWidth={1} />
          <span>Archive // Open & Preserved</span>
        </div>
      </form>
    </section>
  );
}
