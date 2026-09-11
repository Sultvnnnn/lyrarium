import Link from "next/link";
import { ArrowUpRight, Database, Disc, FileText, Users } from "lucide-react";

type StatsLedgerProps = {
  totalSongs: number;
  totalArtists: number;
  totalWords: number;
  artists: { name: string; slug: string; count: number }[];
};

export function StatsLedger({
  totalSongs,
  totalArtists,
  totalWords,
  artists,
}: StatsLedgerProps) {
  const avgWordsPerTrack =
    totalSongs > 0 ? Math.round(totalWords / totalSongs) : 0;

  return (
    <section id="stats" className="px-8 pt-24 pb-20 border-t border-border">
      {/* Header section */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            <p className="text-caption uppercase text-muted-foreground tracking-widest">
              Archive Integrity // Ledger
            </p>
          </div>
          <h2 className="mt-3 text-heading-sm md:text-heading font-light leading-heading-sm md:leading-heading tracking-[-0.02em]">
            The numbers behind the archive.
          </h2>
        </div>

        <p className="text-caption uppercase text-muted-foreground max-w-xs text-right hidden sm:block">
          Every syllable cataloged, every artist honored. An open-access lyric repository.
        </p>
      </div>

      {/* 3-Column Editorial Dossier Bento Grid */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 01: Songs */}
        <div className="group relative border border-border bg-card p-6 md:p-8 flex flex-col justify-between transition-colors hover:border-accent">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-caption font-mono uppercase text-muted-foreground tracking-widest">
                // METRIC 01
              </span>
              <Disc size={16} strokeWidth={1} className="text-muted-foreground group-hover:text-accent transition-colors" />
            </div>

            <p className="mt-8 text-display font-light leading-none tracking-[-0.04em]">
              {totalSongs}
            </p>
            <p className="mt-3 text-caption uppercase tracking-wider text-muted-foreground font-medium">
              Songs Fully Preserved
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            {/* Visual completeness bars */}
            <div className="flex gap-1.5 mb-3">
              <div className="h-1 flex-1 bg-accent" />
              <div className="h-1 flex-1 bg-accent" />
              <div className="h-1 flex-1 bg-accent" />
              <div className="h-1 flex-1 bg-accent/30" />
            </div>
            <p className="text-caption text-muted-foreground leading-relaxed">
              Curated audio metadata, full-length verses, verified personnel credits, and official album art.
            </p>
          </div>
        </div>

        {/* Metric 02: Artists */}
        <div className="group relative border border-border bg-card p-6 md:p-8 flex flex-col justify-between transition-colors hover:border-accent">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-caption font-mono uppercase text-muted-foreground tracking-widest">
                // METRIC 02
              </span>
              <Users size={16} strokeWidth={1} className="text-muted-foreground group-hover:text-accent transition-colors" />
            </div>

            <p className="mt-8 text-display font-light leading-none tracking-[-0.04em]">
              {totalArtists}
            </p>
            <p className="mt-3 text-caption uppercase tracking-wider text-muted-foreground font-medium">
              Distinct Voices & Bands
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            {/* Interactive Artist Pills */}
            <p className="text-caption uppercase text-muted-foreground mb-3 font-medium">
              Active Roster:
            </p>
            <div className="flex flex-wrap gap-2">
              {artists.slice(0, 6).map((a) => (
                <Link
                  key={a.slug}
                  href={`/artist/${a.slug}`}
                  className="rounded-pills border border-border px-3 py-1 text-caption uppercase transition-colors hover:border-accent hover:text-accent bg-muted/30"
                >
                  {a.name} ({a.count})
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Metric 03: Words */}
        <div className="group relative border border-border bg-card p-6 md:p-8 flex flex-col justify-between transition-colors hover:border-accent">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-caption font-mono uppercase text-muted-foreground tracking-widest">
                // METRIC 03
              </span>
              <FileText size={16} strokeWidth={1} className="text-muted-foreground group-hover:text-accent transition-colors" />
            </div>

            <p className="mt-8 text-display font-light leading-none tracking-[-0.04em]">
              {totalWords.toLocaleString("id-ID")}
            </p>
            <p className="mt-3 text-caption uppercase tracking-wider text-muted-foreground font-medium">
              Words Cataloged
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-caption uppercase text-muted-foreground">
                Average Density:
              </span>
              <span className="font-mono text-caption text-accent font-medium">
                ~{avgWordsPerTrack} words / track
              </span>
            </div>
            <p className="text-caption text-muted-foreground leading-relaxed">
              Every poetic stanza, hook, and vocal refrain timestamped and transcribed without alteration.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Ledger Summary Banner */}
      <div className="mt-6 border border-border bg-muted/20 p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Database size={16} strokeWidth={1} className="text-accent" />
          <p className="text-caption uppercase tracking-wider text-muted-foreground">
            Lyrarium Archive // PostgreSQL & Drizzle ORM // Open Contributor Network
          </p>
        </div>

        <Link
          href="/add"
          className="group inline-flex items-center gap-2 text-caption uppercase text-foreground hover:text-accent transition-colors"
        >
          <span>Contribute a song to the archive</span>
          <ArrowUpRight size={14} strokeWidth={1} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </section>
  );
}
