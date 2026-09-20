import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const RECENT_MILESTONES = [
  {
    version: "v0.10.0",
    date: "Sep 20, 2026",
    title: "18-Card Catalog Pagination & Navigation Polish",
    tag: "Catalog / Nav",
    summary:
      "18-item grid pagination across songs and artists catalogs, standardized breadcrumbs, and direct album tab anchor jumping.",
  },
  {
    version: "v0.9.0",
    date: "Sep 19, 2026",
    title: "Artist-Scoped Navigation & Video Framing",
    tag: "Player / Nav",
    summary:
      "Scoped prev/next track traversal to the active artist, archive boundary notices, and corner-bracket resize handle for YouTube players.",
  },
  {
    version: "v0.8.0",
    date: "Sep 18, 2026",
    title: "Multi-Video Carousel & Recent Artists",
    tag: "Media / Home",
    summary:
      "Multiple YouTube performance links per song in a fluid horizontal carousel, and homepage Recent Artists accordion strip.",
  },
  {
    version: "v0.7.0",
    date: "Sep 17, 2026",
    title: "Deep Architecture & Performance Overhaul",
    tag: "Architecture",
    summary:
      "Incremental Static Regeneration (ISR), self-hosted Switzer font, YouTube iframe facade, and CSS containment rendering optimizations.",
  },
  {
    version: "v0.6.0",
    date: "Sep 17, 2026",
    title: "Whisper Voice Search & Focus Mode",
    tag: "Search / AI",
    summary:
      "Automatic bilingual Indonesian and English speech-to-text powered by Whisper, paired with elevated keyboard-driven Focus Search.",
  },
];

export function HomeChangelogPreview() {
  const latest = RECENT_MILESTONES[0];

  return (
    <section id="changelog" className="px-8 pt-20 pb-12">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-8 border-b border-border pb-4 mb-8">
        <div>
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            Project Evolution
          </p>
          <h2 className="mt-2 text-heading-sm font-light tracking-[-0.02em]">
            Archive Changelog.
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-caption uppercase text-muted-foreground">
            10 milestones // {latest.version} latest
          </span>
          <Link
            href="/changelog"
            className="text-caption uppercase text-foreground hover:text-accent transition-colors underline underline-offset-4"
          >
            View full timeline →
          </Link>
        </div>
      </div>

      {/* Editorial Spread: Left Callout Poster + Right Hairline Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Callout Poster (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between border border-border bg-muted/10 p-8 md:p-10 relative group hover:border-accent transition-colors">
          <div>
            <div className="flex items-center justify-between gap-3 text-caption uppercase tracking-widest text-muted-foreground">
              <span className="font-mono text-accent font-medium">LATEST MILESTONE</span>
              <span>{latest.date}</span>
            </div>

            <div className="mt-6">
              <span className="text-display-sm md:text-display font-light text-foreground/90 font-mono leading-none tracking-tight">
                {latest.version}
              </span>
              <h3 className="mt-4 text-heading-sm font-light text-foreground tracking-[-0.02em] leading-tight">
                {latest.title}.
              </h3>
              <p className="mt-3 text-body-sm text-muted-foreground font-light leading-relaxed">
                {latest.summary}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <span className="text-caption uppercase tracking-widest text-muted-foreground">
              10 Milestones // 128 Commits
            </span>
            <Link
              href="/changelog"
              className="inline-flex items-center gap-2 border border-foreground bg-foreground text-background px-5 py-2.5 text-caption uppercase tracking-widest hover:border-accent hover:bg-accent hover:text-accent-foreground transition-colors select-none"
            >
              <span>Explore timeline</span>
              <ArrowUpRight size={16} strokeWidth={1} />
            </Link>
          </div>
        </div>

        {/* Right: Hairline Ledger of Recent Milestones (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="divide-y divide-border border-y border-border">
            {RECENT_MILESTONES.map((m) => (
              <Link
                key={m.version}
                href="/changelog"
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4.5 px-2 hover:bg-muted/20 hover:text-accent transition-all duration-300"
              >
                <div className="flex items-baseline gap-4 sm:gap-6 min-w-0">
                  <span className="font-mono text-caption uppercase text-accent font-medium shrink-0">
                    {m.version}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-body font-light text-foreground group-hover:text-accent transition-colors truncate">
                      {m.title}.
                    </h4>
                    <p className="text-caption uppercase tracking-widest text-muted-foreground mt-0.5">
                      {m.date} // {m.tag}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-caption uppercase tracking-widest text-muted-foreground/60 group-hover:text-accent transition-colors hidden md:inline">
                    Read entry
                  </span>
                  <div className="size-8 flex items-center justify-center border border-border group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <ArrowUpRight
                      size={14}
                      strokeWidth={1}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between text-caption uppercase tracking-widest text-muted-foreground px-2">
            <span>Preserved // Chronological Record</span>
            <Link
              href="/changelog"
              className="text-foreground hover:text-accent transition-colors underline underline-offset-4"
            >
              View all 10 milestones →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
