"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type MilestoneCategory =
  | "All"
  | "Features"
  | "Design & UI"
  | "Performance"
  | "Audio & Voice"
  | "Core & Navigation";

export type Milestone = {
  id: string;
  version: string;
  date: string;
  title: string;
  category: MilestoneCategory;
  summary: string;
  details: string[];
  tag: string;
};

const CATEGORIES: MilestoneCategory[] = [
  "All",
  "Features",
  "Design & UI",
  "Performance",
  "Audio & Voice",
  "Core & Navigation",
];

const MILESTONES: Milestone[] = [
  {
    id: "v0.11.2",
    version: "v0.11.2",
    date: "Sep 22, 2026",
    title: "Home Smooth Rendering & Compositor Architecture",
    category: "Performance",
    tag: "Optimization / Rendering",
    summary:
      "Executed comprehensive performance and design compliance hardening across the home experience. Eliminated layout thrashing, adopted GPU compositor keyframe animations, enhanced keyboard accessibility, and restored vibrant photo contrasts.",
    details: [
      "Converted lyric poster progress animation from layout-triggering width to GPU-accelerated scaleX.",
      "Optimized top-transparent scrims across catalog and accordion views for maximum photo brightness and sharp typography.",
      "Enforced keyboard navigation (role, tabIndex, Enter/Space) on all interactive accordion card strips.",
      "Hardened YouTube video embeds with strict referrer policy and reliable thumbnail failure fallbacks.",
      "Stripped unwanted box-shadows and motion scale transforms in compliance with DESIGN.md.",
    ],
  },
  {
    id: "v0.11.1",
    version: "v0.11.1",
    date: "Sep 22, 2026",
    title: "Route Segment ISR & Native Query Caching",
    category: "Performance",
    tag: "Optimization / Caching",
    summary:
      "Transitioned catalog endpoints to native Next.js ISR (Incremental Static Regeneration), eliminating repetitive Supabase database roundtrips and serving statically cached archives with on-demand mutation revalidation.",
    details: [
      "Replaced forced dynamic rendering on /songs and /artist with 60s ISR route segment caching.",
      "Synchronized server mutation actions to automatically purge stale route caches on create/update.",
      "Zero overhead and zero new dependencies using Next.js native revalidation architecture.",
    ],
  },
  {
    id: "v0.11.0",
    version: "v0.11.0",
    date: "Sep 20, 2026",
    title: "Flexible Fuzzy Search & Google-Style 'Did You Mean' Engine",
    category: "Features",
    tag: "Search / Algorithmic",
    summary:
      "Engineered an in-house Damerau-Levenshtein and token-similarity fuzzy search engine with zero external dependencies. Features real-time typo detection, 'Did you mean?' suggestions across artists, song titles, and lyrics, and automatic approximate match fallbacks.",
    details: [
      "Custom Damerau-Levenshtein edit-distance algorithm handling deletions, insertions, substitutions, and adjacent transpositions.",
      "Multi-entity matching covering artist names, song titles, featuring collaborators, album tags, and lyrics lines.",
      "Interactive 'Did you mean?' suggestion banner in dropdown and search results with one-click adoption and Tab shortcut completion.",
      "Fuzzy fallback discovery preventing dead-end empty results when users introduce misspellings or typographical errors.",
    ],
  },
  {
    id: "v0.10.0",
    version: "v0.10.0",
    date: "Sep 20, 2026",
    title: "18-Card Catalog Pagination & Navigation Polish",
    category: "Core & Navigation",
    tag: "Catalog / Nav",
    summary:
      "Implementation of 18-item grid pagination for songs and artists catalogs, complete breadcrumb standardization across all routes, and direct album tab anchor jumping.",
    details: [
      "18-card capacity (3 rows of 6 cards) on /songs and /artist catalog pages.",
      "Continuous sequential index numbering across pages ([01]...[18], [19]...[36]).",
      "Standardized editorial breadcrumbs across all site routes.",
      "Deep-linking to album tabs on artist profile pages via #discography and query parameters.",
      "Cleaned up redundant explore cards from artist discography to preserve artist focus.",
    ],
  },
  {
    id: "v0.9.0",
    version: "v0.9.0",
    date: "Sep 19, 2026",
    title: "Artist-Scoped Navigation & Responsive Video Framing",
    category: "Features",
    tag: "Player / Nav",
    summary:
      "Scoping previous/next song traversal strictly to the current artist, boundary condition notices, and a custom corner-bracket resize handle for embedded videos.",
    details: [
      "Contextual previous/next song navigation scoped to the active artist, including collaborative featuring tracks.",
      "Editorial archive boundary indicators: First entry in archive. & Latest entry in archive..",
      "Corner-bracket (siku-siku) resize handle for YouTube player with 360px default and max limits.",
      "Right-pinned sidebar layout with rigidly constrained 360px about section.",
    ],
  },
  {
    id: "v0.8.0",
    version: "v0.8.0",
    date: "Sep 18, 2026",
    title: "Multi-Video Carousel & Recent Artists Showcase",
    category: "Features",
    tag: "Media / Home",
    summary:
      "Support for multiple video links per song in a fluid horizontal carousel, and addition of Recent Artists section to the homepage.",
    details: [
      "Horizontal sliding video carousel supporting multiple YouTube performances per song.",
      "Homepage Recent Artists accordion showcase with direct profile navigation.",
      "Synced artist about summaries directly with the database artists table.",
      "Redesigned video play button with editorial hairline styling.",
    ],
  },
  {
    id: "v0.7.0",
    version: "v0.7.0",
    date: "Sep 17, 2026",
    title: "Deep Architecture & Rendering Performance Overhaul",
    category: "Performance",
    tag: "Architecture",
    summary:
      "Comprehensive speed optimization eliminating layout thrashing, reducing latency, and self-hosting font assets.",
    details: [
      "Transitioned homepage queries to Incremental Static Regeneration (ISR) with column-scoped queries.",
      "Self-hosted Switzer font via next/font/local, eliminating third-party CDN latency.",
      "YouTube iframe facade with lazy-loaded thumbnail preview and delayed player instantiation.",
      "IntersectionObserver to pause off-screen hero lyric poster intervals and progress bars.",
      "Pre-computed search haystack index with useDeferredValue to unblock main thread.",
      "Hardware-accelerated CSS containment (contain: layout_paint) and compositor keyframe animations.",
    ],
  },
  {
    id: "v0.6.0",
    version: "v0.6.0",
    date: "Sep 17, 2026",
    title: "Whisper Voice Search & Editorial Focus Mode",
    category: "Audio & Voice",
    tag: "Search / AI",
    summary:
      "Bilingual Indonesian and English speech transcription powered by Whisper, paired with an elevated keyboard-driven Focus Search mode.",
    details: [
      "Backend Whisper audio transcription with automatic bilingual (id-ID / en-US) language detection.",
      "Silence detection auto-stop, vocal activity guards, and animated audio equalizer visualizer.",
      "Tactile audio click feedback on mic engagement and search focus transition.",
      "Focus Search mode with background spotlight dimming and elevated card lift.",
      "Global Ctrl+K keyboard shortcut with arrow key navigation for instant query results.",
    ],
  },
  {
    id: "v0.5.0",
    version: "v0.5.0",
    date: "Sep 15–16, 2026",
    title: "A–Z Catalog Archives & Accordion Standardization",
    category: "Core & Navigation",
    tag: "Catalog",
    summary:
      "Dedicated catalog browsing pages for songs and artists with alphabetical indexing and stabilized accordion mechanics.",
    details: [
      "Dedicated /songs archive and /artist catalog pages with A–Z and symbol filter strips.",
      "Standardized 6 items per row with strict 1:1 active square cover dimensions (460px/500px).",
      "Hover transition lock to completely eliminate mouseover glitching and accordion jitter.",
      "Viewport clamp scaling on fullscreen menu overlay preventing item overflow on small displays.",
    ],
  },
  {
    id: "v0.4.0",
    version: "v0.4.0",
    date: "Sep 14, 2026",
    title: "Unified Edit Hub, Deduplication & Discography Tabs",
    category: "Features",
    tag: "Edit / Storage",
    summary:
      "Creation of the central /edit archive hub, intelligent Supabase media deduplication, and artist discography album switcher.",
    details: [
      "Unified /edit hub with kinetic sliding tab indicators and direction-aware slide transitions.",
      "Autocomplete input for featuring artists with auto-parsing of multiple collaborative performers.",
      "Content-hash (SHA-256) artwork deduplication and safe reference-counted Supabase storage deletion.",
      "Kinetic sliding album discography tab switcher on artist profile pages.",
    ],
  },
  {
    id: "v0.3.0",
    version: "v0.3.0",
    date: "Sep 12–13, 2026",
    title: "Accordion Motion Physics & Editorial Scroll Controls",
    category: "Design & UI",
    tag: "Motion / UI",
    summary:
      "GPU-accelerated accordion easing, 1:1 active square ratio enforcement, and editorial square scroll-to-top controls.",
    details: [
      "GPU-accelerated spring-like accordion hover expansion with ease-[0.25,1,0.35,1].",
      "Strict flex-[0_0_460px] layout ensuring non-distorted 1:1 aspect ratio on expanded cards.",
      "Square scroll-to-top button featuring circular percentage progress tracking bar.",
      "Editorial 'To lyrics' direct smooth jump button in song hero gatefold.",
      "Relocated credits to dedicated liner notes section beneath the full lyric canvas.",
    ],
  },
  {
    id: "v0.2.0",
    version: "v0.2.0",
    date: "Sep 11, 2026",
    title: "Ambient Artist Backdrop & Dynamic Hero Poster",
    category: "Design & UI",
    tag: "Visuals",
    summary:
      "Atmospheric graduated photo backdrops bleeding into the site header, paired with adaptive multi-line lyric posters.",
    details: [
      "Ambient graduated artist backdrop with ultra-smooth 6-stop radial blur and header bleed.",
      "Adaptive font scaling for 1, 2, and 3-line random hero lyric posters.",
      "Hero search box with conditional animated submit button.",
      "First iteration of the expandable collection accordion strip.",
    ],
  },
  {
    id: "v0.1.0",
    version: "v0.1.0",
    date: "Sep 06–10, 2026",
    title: "Lyrarium Foundation & Art-Book Gatefold Architecture",
    category: "Core & Navigation",
    tag: "Foundation",
    summary:
      "Inception of the Lyrarium archive with editorial poster design language, dual-theme color system, and structured credits architecture.",
    details: [
      "Dual-theme color tokens: Bone White / Magenta Bloom (light) & Navy Ink / Signal Yellow (dark).",
      "View Transitions API circle reveal theme toggle.",
      "Editorial art-book gatefold layout for lyrics detail pages with uncropped 1:1 cover art.",
      "Structured credits system supporting Songwriters, Producers, and Custom Personnel roles.",
      "Dedicated artist database entities, biographical migration, and Supabase image storage.",
    ],
  },
];

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
