import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function HomeChangelogPreview() {
  return (
    <section id="changelog" className="px-8 pt-20 pb-16">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-8 border-b border-border pb-4 mb-12">
        <div>
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            Archive Evolution
          </p>
          <h2 className="mt-2 text-heading-sm font-light tracking-[-0.02em]">
            Notes on our development.
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-caption uppercase text-muted-foreground font-mono">
            v0.10.0 // 10 Milestones
          </span>
          <Link
            href="/changelog"
            className="text-caption uppercase text-foreground hover:text-accent transition-colors underline underline-offset-4"
          >
            View timeline →
          </Link>
        </div>
      </div>

      {/* Editorial Spread: Developer Statement + Technical Colophon */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Column: Developer Narrative & Manifest */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-heading font-light tracking-tight leading-[1.1] text-foreground">
              Built line by line.
              <br />
              <span className="text-muted-foreground">Every detail is deliberate.</span>
            </h3>

            <div className="mt-6 space-y-4 max-w-2xl text-body font-light text-muted-foreground leading-relaxed">
              <p>
                Our development philosophy is rooted in permanence and restraint. Lyrarium
                is crafted without synthetic templates, bloated dependencies, or synthetic
                ornamentation. Behind every preserved verse is a continuous discipline of
                database index tuning, custom search algorithms, and precise typography scales.
              </p>
              <p>
                We chronicle each architectural decision, visual calibration, and milestone
                in a transparent public log — ensuring the evolution of this archive remains
                as intentional as the lyrics it safeguards.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/changelog"
              className="inline-flex items-center gap-3 border border-foreground bg-foreground text-background px-6 py-3.5 text-caption uppercase tracking-widest hover:border-accent hover:bg-accent hover:text-accent-foreground transition-all duration-200 select-none group font-medium"
            >
              <span>Explore changelog</span>
              <ArrowUpRight
                size={16}
                strokeWidth={1}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </Link>

            <span className="text-caption uppercase tracking-widest text-muted-foreground">
              // Chronological record from v0.1.0 to present
            </span>
          </div>
        </div>

        {/* Right Column: Architectural Colophon Box */}
        <div className="lg:col-span-5 border border-border bg-muted/5 p-8 flex flex-col justify-between group hover:border-accent transition-colors">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-4 text-caption uppercase tracking-widest text-muted-foreground">
              <span>Colophon // Workbench</span>
              <span className="font-mono text-accent font-medium">Status: Active</span>
            </div>

            <div className="py-6 space-y-4 text-caption uppercase tracking-wider">
              <div className="flex items-baseline justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Current Iteration</span>
                <span className="font-mono text-foreground font-medium">v0.10.0</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Stack Core</span>
                <span className="text-foreground">Next.js 16 // Drizzle ORM</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Typography</span>
                <span className="text-foreground">Switzer 300 / 400</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground">Design Language</span>
                <span className="text-foreground">0px Sharp // No Slop</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-muted-foreground">Archive Entries</span>
                <span className="font-mono text-foreground">10 Milestones Preserved</span>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-border flex items-center justify-between text-caption uppercase text-muted-foreground tracking-widest">
            <span>// Every word speaks</span>
            <Link
              href="/changelog"
              className="text-foreground hover:text-accent transition-colors underline underline-offset-4"
            >
              Full timeline →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
