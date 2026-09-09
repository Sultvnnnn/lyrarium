"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type HeroItem = {
  id: number;
  line: string;
  title: string;
  artist: string;
};

export function LyricPoster({ items }: { items: HeroItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => {
      setIndex((prev) => {
        let next = Math.floor(Math.random() * items.length);
        if (next === prev) next = (next + 1) % items.length;
        return next;
      });
    }, 6000);
    return () => clearInterval(t);
  }, [items.length]);

  const item = items[index];
  if (!item) return null;

  return (
    <div className="min-h-40 md:min-h-55">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${item.id}-${item.line}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href={`/lyrics/${item.id}`} className="group block">
            <p className="text-caption uppercase text-muted-foreground">
              {item.title} — {item.artist}
            </p>
            <h1 className="mt-6 pb-[0.12em] text-heading font-light leading-heading tracking-[-0.023em] text-foreground group-hover:text-accent md:text-display md:leading-display md:tracking-[-0.04em]">
              “{item.line}”
            </h1>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
