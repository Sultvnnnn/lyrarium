type StatsLedgerProps = {
  totalSongs: number;
  totalArtists: number;
  totalWords: number;
};

export function StatsLedger({
  totalSongs,
  totalArtists,
  totalWords,
}: StatsLedgerProps) {
  return (
    <section id="stats" className="px-8 pt-20 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-8 border-b border-border pb-4 mb-8">
        <div>
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            Archive Ledger
          </p>
          <h2 className="mt-2 text-heading-sm font-light tracking-[-0.02em]">
            Statistics.
          </h2>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px border border-border">
        {/* Songs */}
        <div className="group p-6 md:p-8 border-b sm:border-b-0 sm:border-r border-border last:border-0 transition-colors hover:bg-muted/30">
          <p className="text-display font-light leading-none tracking-[-0.04em] group-hover:text-accent transition-colors">
            {totalSongs}
          </p>
          <p className="mt-3 text-caption uppercase tracking-widest text-muted-foreground">
            Songs
          </p>
        </div>

        {/* Artists */}
        <div className="group p-6 md:p-8 border-b sm:border-b-0 sm:border-r border-border last:border-0 transition-colors hover:bg-muted/30">
          <p className="text-display font-light leading-none tracking-[-0.04em] group-hover:text-accent transition-colors">
            {totalArtists}
          </p>
          <p className="mt-3 text-caption uppercase tracking-widest text-muted-foreground">
            Artists
          </p>
        </div>

        {/* Words */}
        <div className="group p-6 md:p-8 transition-colors hover:bg-muted/30">
          <p className="text-display font-light leading-none tracking-[-0.04em] group-hover:text-accent transition-colors">
            {totalWords.toLocaleString("id-ID")}
          </p>
          <p className="mt-3 text-caption uppercase tracking-widest text-muted-foreground">
            Words
          </p>
        </div>
      </div>
    </section>
  );
}
