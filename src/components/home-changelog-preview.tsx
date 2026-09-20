import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function HomeChangelogPreview() {
  return (
    <section id="changelog" className="px-8 pt-20 pb-16">
      {/* Section Header */}
      <div className="border-b border-border pb-4 mb-12">
        <p className="text-caption uppercase text-muted-foreground tracking-widest">
          Archive Evolution
        </p>
        <h2 className="mt-2 text-heading-sm font-light tracking-[-0.02em]">
          Notes on our development.
        </h2>
      </div>

      {/* Editorial Content: Text on left, Explore CTA on right */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 lg:gap-16">
        <div className="max-w-3xl">
          <h3 className="text-heading font-light tracking-tight leading-[1.1] text-foreground">
            Built line by line.
            <br />
            <span className="text-muted-foreground">Every detail is deliberate.</span>
          </h3>

          <div className="mt-6 space-y-4 text-body font-light text-muted-foreground leading-relaxed">
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

        <div className="shrink-0 lg:mb-1">
          <Link
            href="/changelog"
            className="inline-flex items-center gap-3 border border-foreground bg-foreground text-background px-7 py-3.5 text-caption uppercase tracking-widest hover:border-accent hover:bg-accent hover:text-accent-foreground transition-all duration-200 select-none group font-medium"
          >
            <span>Explore changelog</span>
            <ArrowUpRight
              size={16}
              strokeWidth={1}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
