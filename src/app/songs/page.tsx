import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SongsCatalogView } from "@/components/songs-catalog-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Songs Archive — Lyrarium",
  description: "Complete catalog of lyrics in Lyrarium, ordered alphabetically.",
};

export default async function SongsPage() {
  const allSongs = await db.select().from(songs).orderBy(asc(songs.title));

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* Editorial Section Header */}
        <section className="px-8 pt-8 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6 mb-8">
            <div>
              <p className="text-caption uppercase text-muted-foreground tracking-widest">
                The Archive
              </p>
              <h1 className="mt-2 text-heading md:text-display-sm font-light tracking-[-0.03em]">
                All Songs.
              </h1>
            </div>

            <div className="flex items-center gap-2 text-caption uppercase tracking-widest text-muted-foreground">
              <span>{allSongs.length} {allSongs.length === 1 ? "track preserved" : "tracks preserved"}</span>
              <span>//</span>
              <span className="text-foreground">Alphabetical Index</span>
            </div>
          </div>

          <SongsCatalogView songs={allSongs} />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
