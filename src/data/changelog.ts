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

export const CATEGORIES: MilestoneCategory[] = [
  "All",
  "Features",
  "Design & UI",
  "Performance",
  "Audio & Voice",
  "Core & Navigation",
];

export const MILESTONES: Milestone[] = [
  {
    id: "v0.13.0",
    version: "v0.13.0",
    date: "Sep 25–26, 2026",
    title: "Ask Lyra — Editorial AI Lyric Interpretation",
    category: "Features",
    tag: "AI / Interpretation",
    summary:
      "Launched 'Ask Lyra' — an editorial AI lyrical interpretation engine with OpenAI-compatible SSE streaming, bilingual Supabase database caching, interactive reveal flow, and kinetic language switching.",
    details: [
      "Zero-dependency SSE streaming adapter with permanent bilingual Postgres caching (lyra_insights).",
      "Interactive button-first reveal with 0-token simulated typewriter playback for cached entries.",
      "Bilingual EN/ID support with kinetic sliding toggle and smooth Framer Motion crossfades.",
      "Unified lyrics-grid integration allowing media and artist sidebars to scroll smoothly alongside Lyra.",
      "Editorial tone hardening: evocative inquiry copy, em-dash sanitization, and API rate limiting.",
    ],
  },
  {
    id: "v0.12.1",
    version: "v0.12.1",
    date: "Sep 22, 2026",
    title: "Editorial Dropdown UX: Deduplication, Category Tabs & Capped Preview",
    category: "Design & UI",
    tag: "Search / Dropdown UX",
    summary:
      "Redesigned the search dropdown UX for dense approximate match results. Eliminated duplicate items between suggestions and matches, introduced category quick-filter tabs, capped matches to 3 items with an inline expander, and styled lyric snippets with an editorial blockquote aesthetic.",
    details: [
      "Eliminated duplicate entries across suggestions and direct match lists via set-based deduplication.",
      "Added sharp 0px category filter tabs ('Semua', 'Saran', 'Lagu', 'Artis') for instant scannability on dense result sets.",
      "Introduced a capped preview (max 3 items) with an inline expander ('Buka X lagu lainnya') to prevent awkward card cut-offs and scroll fatigue.",
      "Upgraded lyric match preview into an editorial callout block with 'LIRIK //' eyebrow caption and accent border hairline.",
      "Maintained 100% WAI-ARIA combobox keyboard navigation synchronized dynamically with active filter tabs and expanded state.",
    ],
  },
  {
    id: "v0.12.0",
    version: "v0.12.0",
    date: "Sep 22, 2026",
    title: "Typo-Tolerant Trigram Fuzzy Engine & Typeahead Suggestions",
    category: "Features",
    tag: "Search / Fuzzy & Suggestions",
    summary:
      "Implemented a zero-dependency character trigram index and Damerau-Levenshtein refinement engine for real-time search. Delivers sub-3ms typo-tolerant candidate pruning, WAI-ARIA combobox typeahead suggestions, and 'Maksud Anda' chips.",
    details: [
      "Engineered zero-dependency Trigram Index with inverted posting lists for ultra-fast candidate pruning (<3ms execution).",
      "Dynamic Damerau-Levenshtein threshold (max(2, floor(len * 0.35))) handling transpositions and multi-character spelling mistakes.",
      "Accessible WAI-ARIA Combobox pattern with keyboard navigation (ArrowUp/Down, Enter, Escape, Tab).",
      "Interactive 'Maksud Anda:' (Did-you-mean) chip triggering instant query replacement and exact search.",
      "Precise <mark> character-level highlight styling using semantic tokens (bg-accent text-accent-foreground).",
      "Strict compliance with DESIGN.md: 0px sharp chrome, zero shadows, zero blur/backdrop filters.",
    ],
  },
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
