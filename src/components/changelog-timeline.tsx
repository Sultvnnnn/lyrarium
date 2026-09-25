"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  CATEGORIES,
  MILESTONES,
  type Milestone,
  type MilestoneCategory,
} from "@/data/changelog";

export type { Milestone, MilestoneCategory };


export function ChangelogTimeline() {
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory>("All");
  const [openHighlights, setOpenHighlights] = useState<Record<string, boolean>>({});

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
      <div className="relative w-full max-w-5xl mx-auto py-8">
        {/* Central Vertical Spine (Desktop) - 2px solid hairline */}
        <div className="hidden md:block absolute left-1/2 -ml-[1px] top-2 bottom-2 w-[2px] bg-border z-0 pointer-events-none" />

        {/* Left Vertical Spine (Mobile) - 2px solid hairline */}
        <div className="block md:hidden absolute left-4 -ml-[1px] top-2 bottom-2 w-[2px] bg-border z-0 pointer-events-none" />

        <div className="space-y-12 md:space-y-16">
          {filteredMilestones.map((m, idx) => {
            // Alternating zigzag: even items on Left, odd items on Right
            const isLeft = idx % 2 === 0;
            const isOpen = Boolean(openHighlights[m.id]);

            return (
              <div
                key={m.id}
                className="relative flex flex-col md:flex-row items-center w-full group"
              >
                {/* Center Node on Spine (Desktop) */}
                <div className="hidden md:flex absolute left-1/2 top-8 -translate-x-1/2 -translate-y-1/2 size-3.5 border-2 border-border bg-background group-hover:border-accent group-hover:bg-accent transition-colors z-20" />

                {/* Left Node on Spine (Mobile) */}
                <div className="flex md:hidden absolute left-4 top-8 -translate-x-1/2 -translate-y-1/2 size-3.5 border-2 border-border bg-background group-hover:border-accent group-hover:bg-accent transition-colors z-20" />

                {isLeft ? (
                  /* ========================================================================= */
                  /* EVEN: CARD ON LEFT (Desktop), EDITORIAL META ON RIGHT                     */
                  /* ========================================================================= */
                  <>
                    {/* Left Side: The Card */}
                    <div className="w-full md:w-1/2 pl-12 md:pl-0 md:pr-10 relative">
                      {/* Horizontal Connecting Stem to Center Spine (Desktop) */}
                      <div className="hidden md:block absolute right-0 top-8 w-10 h-[2px] bg-border group-hover:bg-accent transition-colors z-10" />
                      {/* Horizontal Connecting Stem to Left Spine (Mobile) */}
                      <div className="block md:hidden absolute left-4 top-8 w-8 h-[2px] bg-border group-hover:bg-accent transition-colors z-10" />

                      {/* Card Surface (Seamless, compact, no version or date inside) */}
                      <div className="border border-border bg-muted/10 p-6 md:p-7 transition-colors hover:border-accent">
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
                      </div>
                    </div>

                    {/* Right Side: Editorial Meta Stamp (Desktop: SemVer & Date) */}
                    <div className="hidden md:flex md:w-1/2 pl-12 flex-col justify-center select-none">
                      <span className="text-display-sm lg:text-display font-light text-muted-foreground/15 group-hover:text-foreground/30 transition-colors font-mono leading-none">
                        {m.version}
                      </span>
                      <p className="mt-2 text-caption uppercase tracking-widest text-muted-foreground">
                        {m.date}
                      </p>
                    </div>
                  </>
                ) : (
                  /* ========================================================================= */
                  /* ODD: EDITORIAL META ON LEFT, CARD ON RIGHT (Desktop)                      */
                  /* ========================================================================= */
                  <>
                    {/* Left Side: Editorial Meta Stamp (Desktop: SemVer & Date) */}
                    <div className="hidden md:flex md:w-1/2 pr-12 flex-col justify-center items-end text-right select-none">
                      <span className="text-display-sm lg:text-display font-light text-muted-foreground/15 group-hover:text-foreground/30 transition-colors font-mono leading-none">
                        {m.version}
                      </span>
                      <p className="mt-2 text-caption uppercase tracking-widest text-muted-foreground">
                        {m.date}
                      </p>
                    </div>

                    {/* Right Side: The Card */}
                    <div className="w-full md:w-1/2 pl-12 md:pl-10 md:pr-0 relative">
                      {/* Horizontal Connecting Stem to Center Spine (Desktop) */}
                      <div className="hidden md:block absolute left-0 top-8 w-10 h-[2px] bg-border group-hover:bg-accent transition-colors z-10" />
                      {/* Horizontal Connecting Stem to Left Spine (Mobile) */}
                      <div className="block md:hidden absolute left-4 top-8 w-8 h-[2px] bg-border group-hover:bg-accent transition-colors z-10" />

                      {/* Card Surface (Seamless, compact, no version or date inside) */}
                      <div className="border border-border bg-muted/10 p-6 md:p-7 transition-colors hover:border-accent">
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
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
