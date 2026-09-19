"use client";

import React, { useMemo, useState } from "react";
import { GitCommit, Calendar, Tag, ArrowUpRight } from "lucide-react";

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
  commits: string[];
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
    id: "v1.9",
    version: "v1.9",
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
    commits: ["9295561", "0cc0cce", "fef4de4", "92e020d"],
  },
  {
    id: "v1.8",
    version: "v1.8",
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
    commits: ["27388b8", "a11892c", "6db566a", "a7ddb98", "552fcf1", "63579b5", "1991527"],
  },
  {
    id: "v1.7",
    version: "v1.7",
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
    commits: ["4d79dc8", "41fee04", "31919c3", "c9e0174"],
  },
  {
    id: "v1.6",
    version: "v1.6",
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
    commits: ["36bf809", "3e0d8fb", "6047bab", "2233402", "7bec8ca", "8eac0e7", "e83e47e", "ba7feda", "e1d00b0"],
  },
  {
    id: "v1.5",
    version: "v1.5",
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
    commits: ["bf8533f", "f779545", "0452036", "c3f73ab", "efaa475", "2f7f3b7", "8428d3e", "7321dac"],
  },
  {
    id: "v1.4",
    version: "v1.4",
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
    commits: ["3ecc990", "c0d75e6", "869bd6f", "5773628", "19e6d3d", "8b77091"],
  },
  {
    id: "v1.3",
    version: "v1.3",
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
    commits: ["c7c12ae", "c185035", "f58ceb2", "c5d116d", "08b7228", "7b35054", "cb8d9d3", "587ac9f"],
  },
  {
    id: "v1.2",
    version: "v1.2",
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
    commits: ["aaa38d2", "3105279", "677220e", "4b34462", "79d30b2", "0d857dd", "58b561f"],
  },
  {
    id: "v1.1",
    version: "v1.1",
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
    commits: ["c9053f8", "c253529", "e7e2597", "a673f46", "6636b94", "1425bec", "c4ab03f"],
  },
  {
    id: "v1.0",
    version: "v1.0",
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
    commits: ["4d9bb2d", "881dd5e", "4a903af", "6fce000", "d516d21", "863ff29", "7e00984"],
  },
];

export function ChangelogTimeline() {
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory>("All");

  const filteredMilestones = useMemo(() => {
    if (selectedCategory === "All") return MILESTONES;
    return MILESTONES.filter((m) => m.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="w-full space-y-12">
      {/* Category Filter Pills & Archive Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        {/* Category Filters */}
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

        {/* Overview Stats */}
        <div className="flex items-center gap-4 text-caption uppercase tracking-widest text-muted-foreground shrink-0">
          <span>{filteredMilestones.length} of {MILESTONES.length} milestones</span>
          <span>//</span>
          <span>128 commits</span>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 md:pl-10 space-y-12 before:absolute before:left-[7px] md:before:left-[11px] before:top-3 before:bottom-3 before:w-[1px] before:bg-border">
        {filteredMilestones.map((m, idx) => {
          return (
            <article
              key={m.id}
              className="relative group"
            >
              {/* Timeline Node Marker */}
              <div className="absolute -left-[29px] md:-left-[45px] top-4 size-3 border border-border bg-background transition-colors group-hover:border-accent group-hover:bg-accent" />

              {/* Milestone Card */}
              <div className="border border-border bg-muted/10 p-6 md:p-8 transition-colors hover:border-accent">
                {/* Header Meta: Version, Date, Category */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-caption font-mono uppercase tracking-wider border border-accent bg-accent text-accent-foreground font-medium">
                      {m.version}
                    </span>
                    <span className="text-caption uppercase tracking-widest text-foreground font-light">
                      {m.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-caption uppercase tracking-widest text-muted-foreground">
                    <Calendar size={16} strokeWidth={1} />
                    <span>{m.date}</span>
                  </div>
                </div>

                {/* Milestone Title & Summary */}
                <div>
                  <h2 className="text-heading-sm font-light text-foreground tracking-[-0.02em]">
                    {m.title}.
                  </h2>
                  <p className="mt-3 text-body-sm text-muted-foreground leading-relaxed">
                    {m.summary}
                  </p>
                </div>

                {/* Bullet Points */}
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-caption uppercase tracking-widest text-muted-foreground mb-3">
                    Key Highlights //
                  </p>
                  <ul className="space-y-2">
                    {m.details.map((item, dIdx) => (
                      <li
                        key={dIdx}
                        className="text-body-sm text-foreground flex items-start gap-2.5 font-light"
                      >
                        <span className="text-accent select-none font-mono text-caption leading-relaxed">//</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Meta: Related Git Commit Hashes */}
                <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-caption uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <GitCommit size={16} strokeWidth={1} />
                      <span>Commits:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {m.commits.map((hash) => (
                        <span
                          key={hash}
                          className="px-2 py-0.5 border border-border font-mono text-caption text-muted-foreground uppercase"
                        >
                          {hash}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="text-caption uppercase tracking-widest text-muted-foreground font-mono">
                    [{String(MILESTONES.length - idx).padStart(2, "0")}]
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
