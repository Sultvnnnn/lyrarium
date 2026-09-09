"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroItem = {
  id: number;
  line: string;
  title: string;
  artist: string;
};

const DURATION_MS = 6000;

export function LyricPoster({
  items,
  centered = true,
}: {
  items: HeroItem[];
  centered?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    if (items.length < 2 || isPaused) return;

    const timer = setInterval(() => {
      setIndex((prev) => {
        let next = Math.floor(Math.random() * items.length);
        if (next === prev) next = (next + 1) % items.length;
        return next;
      });
      setProgressKey((k) => k + 1);
    }, DURATION_MS);

    return () => clearInterval(timer);
  }, [items.length, isPaused]);

  const item = items[index];
  if (!item) return null;

  const nextItem = () => {
    setIndex((prev) => (prev + 1) % items.length);
    setProgressKey((k) => k + 1);
  };

  const prevItem = () => {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
    setProgressKey((k) => k + 1);
  };

  const words = item.line.split(" ").filter(Boolean);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.08,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.02,
        staggerDirection: -1,
        duration: 0.25,
      },
    },
  };

  const wordVariants = {
    hidden: {
      y: "115%",
      opacity: 0,
    },
    visible: {
      y: "0%",
      opacity: 1,
      transition: {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
    exit: {
      y: "-115%",
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  const eyebrowVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" as const },
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: { duration: 0.25 },
    },
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-3xl min-h-[170px] md:min-h-[190px] flex flex-col justify-center select-none ${
        centered ? "items-center text-center mx-auto" : "items-start text-left"
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${item.id}-${item.line}-${index}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full"
        >
          {/* Eyebrow / Meta row */}
          <motion.div
            variants={eyebrowVariants}
            className={`flex items-center gap-3 mb-3 text-caption uppercase text-muted-foreground ${
              centered ? "justify-center" : "justify-start"
            }`}
          >
            <span className="tracking-widest font-normal">
              {item.title} — {item.artist}
            </span>
            <span className="text-border">//</span>
            <span className="text-[11px] tabular-nums text-muted-foreground/70">
              {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
          </motion.div>

          {/* Kinetic Quote Heading with Split-Word Mask */}
          <Link href={`/lyrics/${item.id}`} className="group block focus:outline-none">
            <h2
              className={`flex flex-wrap items-center gap-x-[0.26em] gap-y-1 text-heading-sm md:text-heading font-light leading-heading tracking-[-0.023em] text-foreground transition-colors group-hover:text-accent pb-1 ${
                centered ? "justify-center" : "justify-start"
              }`}
            >
              <span className="text-accent/80 font-light select-none mr-0.5">“</span>
              {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden pb-1">
                  <motion.span variants={wordVariants} className="inline-block">
                    {word}
                  </motion.span>
                </span>
              ))}
              <span className="text-accent/80 font-light select-none ml-0.5">”</span>
            </h2>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Editorial Hairline Timeline & Controls */}
      <div
        className={`mt-4 flex items-center gap-3 w-full max-w-xs transition-opacity duration-300 ${
          centered ? "justify-center" : "justify-start"
        }`}
      >
        <button
          type="button"
          onClick={prevItem}
          aria-label="Previous lyric"
          className="text-muted-foreground/60 hover:text-accent transition-colors p-1"
        >
          <ChevronLeft size={14} strokeWidth={1} />
        </button>

        {/* 1px Hairline Progress Bar */}
        <div className="relative h-[1px] flex-1 bg-border/40 overflow-hidden">
          <motion.div
            key={progressKey}
            initial={{ width: "0%" }}
            animate={{ width: isPaused ? undefined : "100%" }}
            transition={{
              duration: DURATION_MS / 1000,
              ease: "linear",
            }}
            className="absolute top-0 left-0 h-full bg-accent"
          />
        </div>

        <button
          type="button"
          onClick={nextItem}
          aria-label="Next lyric"
          className="text-muted-foreground/60 hover:text-accent transition-colors p-1"
        >
          <ChevronRight size={14} strokeWidth={1} />
        </button>
      </div>
    </div>
  );
}
