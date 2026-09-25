"use client";

import React, { useMemo, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";

import {
  CATEGORIES,
  MILESTONES,
  type Milestone,
  type MilestoneCategory,
} from "@/data/changelog";

export type { Milestone, MilestoneCategory };

const EDITORIAL_EASE = [0.22, 1, 0.36, 1] as const;

const rowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const nodeVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.35, ease: EDITORIAL_EASE },
  },
};

const stemVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.45, ease: EDITORIAL_EASE },
  },
};

const leftCardVariants: Variants = {
  hidden: { opacity: 0, x: -24, y: 12 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.55, ease: EDITORIAL_EASE },
  },
};

const rightCardVariants: Variants = {
  hidden: { opacity: 0, x: 24, y: 12 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.55, ease: EDITORIAL_EASE },
  },
};

const rightMetaVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EDITORIAL_EASE },
  },
};

const leftMetaVariants: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EDITORIAL_EASE },
  },
};

export function ChangelogTimeline() {
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory>("All");
  const [openHighlights, setOpenHighlights] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 80%"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  });

  const toggleHighlights = (id: string) => {
    setOpenHighlights((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredMilestones = useMemo(() => {
    if (selectedCategory === "All") return MILESTONES;
    return MILESTONES.filter((m) => m.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="w-full space-y-12">
      {/* Category Filter Bar & Metric Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "All"
                ? MILESTONES.length
                : MILESTONES.filter((m) => m.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-9 px-3.5 text-caption uppercase tracking-wider transition-colors select-none border ${
                  isSelected
                    ? "border-accent bg-accent text-accent-foreground font-medium"
                    : "border-border text-foreground hover:border-accent hover:text-accent"
                }`}
              >
                <span>{cat}</span>
                <span className="ml-1.5 opacity-60 font-mono text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Header Stats */}
        <div className="flex items-center gap-3 text-caption uppercase tracking-widest text-muted-foreground shrink-0 select-none">
          <span>{filteredMilestones.length} of {MILESTONES.length} milestones</span>
          <span>//</span>
          <span>Sep 2026</span>
        </div>
      </div>

      {/* Alternating Zigzag Timeline Stream */}
      <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-8">
        {/* Central Vertical Spine (Desktop) - 2px solid hairline with live accent beam */}
        <div className="hidden md:block absolute left-1/2 -ml-[1px] top-2 bottom-2 w-[2px] bg-border z-0 pointer-events-none overflow-hidden">
          <motion.div
            style={{ scaleY, transformOrigin: "top" }}
            className="w-full h-full bg-accent"
          />
        </div>

        {/* Left Vertical Spine (Mobile) - 2px solid hairline with live accent beam */}
        <div className="block md:hidden absolute left-4 -ml-[1px] top-2 bottom-2 w-[2px] bg-border z-0 pointer-events-none overflow-hidden">
          <motion.div
            style={{ scaleY, transformOrigin: "top" }}
            className="w-full h-full bg-accent"
          />
        </div>

        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-12 md:space-y-16"
        >
          {filteredMilestones.map((m, idx) => {
            // Alternating zigzag: even items on Left, odd items on Right
            const isLeft = idx % 2 === 0;
            const isOpen = Boolean(openHighlights[m.id]);

            return (
              <motion.div
                key={m.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-70px" }}
                variants={rowVariants}
                className="relative flex flex-col md:flex-row items-center w-full group"
              >
                {/* Center Node on Spine (Desktop) */}
                <motion.div
                  variants={nodeVariants}
                  className="hidden md:flex absolute left-1/2 top-8 -translate-x-1/2 -translate-y-1/2 size-3.5 border-2 border-border bg-background group-hover:border-accent group-hover:bg-accent transition-colors z-20"
                />

                {/* Left Node on Spine (Mobile) */}
                <motion.div
                  variants={nodeVariants}
                  className="flex md:hidden absolute left-4 top-8 -translate-x-1/2 -translate-y-1/2 size-3.5 border-2 border-border bg-background group-hover:border-accent group-hover:bg-accent transition-colors z-20"
                />

                {isLeft ? (
                  /* ========================================================================= */
                  /* EVEN: CARD ON LEFT (Desktop), EDITORIAL META ON RIGHT                     */
                  /* ========================================================================= */
                  <>
                    {/* Left Side: The Card */}
                    <div className="w-full md:w-1/2 pl-12 md:pl-0 md:pr-10 relative">
                      {/* Horizontal Connecting Stem to Center Spine (Desktop) */}
                      <motion.div
                        variants={stemVariants}
                        style={{ transformOrigin: "right" }}
                        className="hidden md:block absolute right-0 top-8 w-10 h-[2px] bg-border group-hover:bg-accent transition-colors z-10"
                      />
                      {/* Horizontal Connecting Stem to Left Spine (Mobile) */}
                      <motion.div
                        variants={stemVariants}
                        style={{ transformOrigin: "left" }}
                        className="block md:hidden absolute left-4 top-8 w-8 h-[2px] bg-border group-hover:bg-accent transition-colors z-10"
                      />

                      {/* Card Surface (Seamless, compact, no version or date inside) */}
                      <motion.div
                        variants={leftCardVariants}
                        className="border border-border bg-muted/10 p-6 md:p-7 transition-colors hover:border-accent"
                      >
                        {/* Mobile-only date & version header above title */}
                        <div className="md:hidden flex items-center justify-between text-caption uppercase tracking-widest text-muted-foreground mb-3 font-mono">
                          <span className="text-accent font-medium">{m.version}</span>
                          <span>{m.date}</span>
                        </div>

                        {/* Tag & Title */}
                        <p className="text-caption uppercase tracking-widest text-muted-foreground mb-1.5 font-light">
                          {m.tag}
                        </p>
                        <h2 className="text-heading-sm md:text-subheading font-light text-foreground tracking-[-0.02em]">
                          {m.title}.
                        </h2>
                        <p className="mt-2 text-body-sm text-muted-foreground font-light leading-relaxed">
                          {m.summary}
                        </p>

                        {/* Highlights Toggle Trigger (Seamless, borderless inline button) */}
                        <div className="mt-3.5 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleHighlights(m.id)}
                            className="inline-flex items-center gap-1.5 text-caption uppercase tracking-widest text-muted-foreground/70 hover:text-accent transition-colors select-none cursor-pointer group/toggle"
                            aria-expanded={isOpen}
                          >
                            <span className="group-hover/toggle:text-accent transition-colors font-medium">
                              Highlights
                            </span>
                            <ChevronDown
                              size={12}
                              strokeWidth={1.5}
                              className={`transition-transform duration-300 text-muted-foreground/70 group-hover/toggle:text-accent ${
                                isOpen ? "rotate-180 text-accent" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Animated Collapsible Highlights List */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <ul className="mt-3 space-y-1.5 pt-2 border-t border-border/40">
                                {m.details.map((item, dIdx) => (
                                  <li
                                    key={dIdx}
                                    className="text-body-sm text-foreground flex items-start gap-2 font-light"
                                  >
                                    <span className="text-accent select-none font-mono text-caption leading-relaxed">//</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>

                    {/* Right Side: Editorial Meta Stamp (Desktop: SemVer & Date) */}
                    <motion.div
                      variants={rightMetaVariants}
                      className="hidden md:flex md:w-1/2 pl-12 flex-col justify-center select-none"
                    >
                      <span className="text-display-sm lg:text-display font-light text-muted-foreground/15 group-hover:text-foreground/30 transition-colors font-mono leading-none">
                        {m.version}
                      </span>
                      <p className="mt-2 text-caption uppercase tracking-widest text-muted-foreground">
                        {m.date}
                      </p>
                    </motion.div>
                  </>
                ) : (
                  /* ========================================================================= */
                  /* ODD: EDITORIAL META ON LEFT, CARD ON RIGHT (Desktop)                      */
                  /* ========================================================================= */
                  <>
                    {/* Left Side: Editorial Meta Stamp (Desktop: SemVer & Date) */}
                    <motion.div
                      variants={leftMetaVariants}
                      className="hidden md:flex md:w-1/2 pr-12 flex-col justify-center items-end text-right select-none"
                    >
                      <span className="text-display-sm lg:text-display font-light text-muted-foreground/15 group-hover:text-foreground/30 transition-colors font-mono leading-none">
                        {m.version}
                      </span>
                      <p className="mt-2 text-caption uppercase tracking-widest text-muted-foreground">
                        {m.date}
                      </p>
                    </motion.div>

                    {/* Right Side: The Card */}
                    <div className="w-full md:w-1/2 pl-12 md:pl-10 md:pr-0 relative">
                      {/* Horizontal Connecting Stem to Center Spine (Desktop) */}
                      <motion.div
                        variants={stemVariants}
                        style={{ transformOrigin: "left" }}
                        className="hidden md:block absolute left-0 top-8 w-10 h-[2px] bg-border group-hover:bg-accent transition-colors z-10"
                      />
                      {/* Horizontal Connecting Stem to Left Spine (Mobile) */}
                      <motion.div
                        variants={stemVariants}
                        style={{ transformOrigin: "left" }}
                        className="block md:hidden absolute left-4 top-8 w-8 h-[2px] bg-border group-hover:bg-accent transition-colors z-10"
                      />

                      {/* Card Surface (Seamless, compact, no version or date inside) */}
                      <motion.div
                        variants={rightCardVariants}
                        className="border border-border bg-muted/10 p-6 md:p-7 transition-colors hover:border-accent"
                      >
                        {/* Mobile-only date & version header above title */}
                        <div className="md:hidden flex items-center justify-between text-caption uppercase tracking-widest text-muted-foreground mb-3 font-mono">
                          <span className="text-accent font-medium">{m.version}</span>
                          <span>{m.date}</span>
                        </div>

                        {/* Tag & Title */}
                        <p className="text-caption uppercase tracking-widest text-muted-foreground mb-1.5 font-light">
                          {m.tag}
                        </p>
                        <h2 className="text-heading-sm md:text-subheading font-light text-foreground tracking-[-0.02em]">
                          {m.title}.
                        </h2>
                        <p className="mt-2 text-body-sm text-muted-foreground font-light leading-relaxed">
                          {m.summary}
                        </p>

                        {/* Highlights Toggle Trigger (Seamless, borderless inline button) */}
                        <div className="mt-3.5 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleHighlights(m.id)}
                            className="inline-flex items-center gap-1.5 text-caption uppercase tracking-widest text-muted-foreground/70 hover:text-accent transition-colors select-none cursor-pointer group/toggle"
                            aria-expanded={isOpen}
                          >
                            <span className="group-hover/toggle:text-accent transition-colors font-medium">
                              Highlights
                            </span>
                            <ChevronDown
                              size={12}
                              strokeWidth={1.5}
                              className={`transition-transform duration-300 text-muted-foreground/70 group-hover/toggle:text-accent ${
                                isOpen ? "rotate-180 text-accent" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Animated Collapsible Highlights List */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <ul className="mt-3 space-y-1.5 pt-2 border-t border-border/40">
                                {m.details.map((item, dIdx) => (
                                  <li
                                    key={dIdx}
                                    className="text-body-sm text-foreground flex items-start gap-2 font-light"
                                  >
                                    <span className="text-accent select-none font-mono text-caption leading-relaxed">//</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
