import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { ChangelogTimeline } from "@/components/changelog-timeline";

export const metadata: Metadata = {
  title: "Archive Changelog — Lyrarium",
  description:
    "Chronological evolution and architectural timeline of features, design refinements, and performance milestones in Lyrarium.",
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-clip">
      <div>
        <SiteHeader />

        {/* Breadcrumb Navigation */}
        <div className="px-8 pt-8">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Changelog" },
            ]}
          />
        </div>

        {/* Section Header */}
        <section className="px-8 pt-6 pb-16">
          <div className="border-b border-border pb-6 mb-10">
            <div>
              <p className="text-caption uppercase text-muted-foreground tracking-widest">
                Project Evolution // 2026
              </p>
              <h1 className="mt-2 text-heading md:text-display-sm font-light tracking-[-0.03em]">
                Archive Changelog.
              </h1>
              <p className="mt-3 text-body-sm text-muted-foreground max-w-2xl">
                A complete chronological record of architectural breakthroughs, editorial
                design decisions, and functional additions since Lyrarium was built.
              </p>
            </div>
          </div>

          <ChangelogTimeline />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
