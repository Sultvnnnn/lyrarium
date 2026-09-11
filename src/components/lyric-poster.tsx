"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroItem = {
  id: number;
  lines?: string[];
  line?: string;
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

  const displayLines = (
    item.lines && item.lines.length > 0
      ? item.lines
      : (item.line || "").split("\n").filter(Boolean)
  ).slice(0, 3);

  const lineCount = Math.max(displayLines.length, 1);

  // Font size dinamis sesuai jumlah baris (1 baris = besar, 2 baris = sedang, 3 baris = compact)
  const fontSizeClass =
    lineCount === 1
      ? "text-[26px] sm:text-[38px] md:text-[50px] lg:text-[58px] leading-[1.1] tracking-[-0.03em]"
      : lineCount === 2
      ? "text-[19px] sm:text-[26px] md:text-[32px] lg:text-[38px] leading-[1.2] tracking-[-0.024em]"
      : "text-[15px] sm:text-[20px] md:text-[24px] lg:text-[28px] leading-[1.3] tracking-[-0.016em]";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.035,
        delayChildren: 0.06,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.015,
        staggerDirection: -1,
        duration: 0.22,
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
        duration: 0.28,
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
      className={`relative w-full max-w-5xl xl:max-w-6xl min-h-[175px] sm:min-h-[200px] md:min-h-[220px] flex flex-col justify-center select-none px-4 ${
        centered ? "items-center text-center mx-auto" : "items-start text-left"
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${item.id}-${displayLines.join("-")}-${index}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full"
        >
          {/* Eyebrow: Hanya Judul & Nama Artis */}
          <motion.div
            variants={eyebrowVariants}
            className={`flex items-center mb-3 text-caption uppercase text-muted-foreground ${
              centered ? "justify-center text-center" : "justify-start text-left"
            }`}
          >
            <span className="tracking-widest font-normal">
              {item.title} — {item.artist}
            </span>
          </motion.div>

          {/* Kinetic Quote Stanza (1, 2, atau 3 baris) */}
          <Link href={`/lyrics/${item.id}`} className="group block focus:outline-none">
            <h2 className="flex flex-col items-center gap-1 sm:gap-1.5 w-full">
              {displayLines.map((lineStr, lineIdx) => {
                const isFirstLine = lineIdx === 0;
                const isLastLine = lineIdx === displayLines.length - 1;
                const words = lineStr.split(" ").filter(Boolean);
                const firstWord = words[0] || "";
                const lastWord = words[words.length - 1] || "";
                const middleWords = words.length > 2 ? words.slice(1, -1) : [];

                return (
                  <div
                    key={lineIdx}
                    className={`flex flex-wrap items-center gap-x-[0.28em] gap-y-0.5 font-light text-foreground transition-colors group-hover:text-accent pb-0.5 [text-wrap:balance] ${fontSizeClass} ${
                      centered ? "justify-center text-center" : "justify-start text-left"
                    }`}
                  >
                    {words.length <= 1 ? (
                      <span className="inline-block overflow-hidden pb-1">
                        <motion.span variants={wordVariants} className="inline-block">
                          {isFirstLine && (
                            <span className="text-accent/80 font-light select-none mr-0.5">“</span>
                          )}
                          {firstWord}
                          {isLastLine && (
                            <span className="text-accent/80 font-light select-none ml-0.5">”</span>
                          )}
                        </motion.span>
                      </span>
                    ) : (
                      <>
                        {/* Kata pertama */}
                        <span className="inline-block overflow-hidden pb-1">
                          <motion.span variants={wordVariants} className="inline-block">
                            {isFirstLine && (
                              <span className="text-accent/80 font-light select-none mr-0.5">“</span>
                            )}
                            {firstWord}
                          </motion.span>
                        </span>

                        {/* Kata-kata tengah */}
                        {middleWords.map((word, wIdx) => (
                          <span key={wIdx} className="inline-block overflow-hidden pb-1">
                            <motion.span variants={wordVariants} className="inline-block">
                              {word}
                            </motion.span>
                          </span>
                        ))}

                        {/* Kata terakhir */}
                        <span className="inline-block overflow-hidden pb-1">
                          <motion.span variants={wordVariants} className="inline-block">
                            {lastWord}
                            {isLastLine && (
                              <span className="text-accent/80 font-light select-none ml-0.5">”</span>
                            )}
                          </motion.span>
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
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
