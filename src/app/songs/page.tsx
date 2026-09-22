import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SongsCatalogView } from "@/components/songs-catalog-view";
import { Breadcrumb } from "@/components/breadcrumb";

export const revalidate = 60;

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

        {/* Breadcrumb navigation */}
        <div className="px-8 pt-8">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Songs" },
            ]}
          />
        </div>

        {/* Editorial Section Header */}
        <section className="px-8 pt-6 pb-4">
          <div className="border-b border-border pb-6 mb-8">
            <div>
              <p className="text-caption uppercase text-muted-foreground tracking-widest">
                The Archive
              </p>
              <h1 className="mt-2 text-heading md:text-display-sm font-light tracking-[-0.03em]">
                All Songs.
              </h1>
            </div>
          </div>

          <SongsCatalogView songs={allSongs} />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
