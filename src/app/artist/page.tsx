import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { songs, artists as artistsTable } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArtistsCatalogView } from "@/components/artists-catalog-view";
import type { AccordionArtist } from "@/components/artist-accordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artist Index — Lyrarium",
  description: "Complete index of artist dossiers in Lyrarium, ordered alphabetically.",
};

export default async function ArtistIndexPage() {
  const allSongs = await db.select().from(songs);
  const allDbArtists = await db.select().from(artistsTable).orderBy(asc(artistsTable.name));

  // Count songs per artist including featuring
  const artistMap = new Map<string, number>();
  for (const s of allSongs) {
    const mainArtist = s.artist.trim();
    artistMap.set(mainArtist, (artistMap.get(mainArtist) ?? 0) + 1);

    if (s.featuring) {
      const feats = s.featuring.split(/,\s*/).map((f) => f.trim()).filter(Boolean);
      for (const f of feats) {
        artistMap.set(f, (artistMap.get(f) ?? 0) + 1);
      }
    }
  }

  // Build complete list of AccordionArtist items
  const artistItems: AccordionArtist[] = [];
  for (const a of allDbArtists) {
    const count = artistMap.get(a.name) ?? 0;
    artistItems.push({
      name: a.name,
      slug: a.slug,
      about: a.about,
      imageUrl: a.imageUrl,
      songCount: count,
    });
  }

  // Add any artist present in songs but not registered in artists table
  for (const [name, count] of artistMap.entries()) {
    if (!artistItems.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
      artistItems.push({
        name,
        slug: name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        about: null,
        imageUrl: null,
        songCount: count,
      });
    }
  }

  // Sort alphabetically by name
  artistItems.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* Editorial Section Header */}
        <section className="px-8 pt-8 pb-4">
          <div className="border-b border-border pb-6 mb-8">
            <div>
              <p className="text-caption uppercase text-muted-foreground tracking-widest">
                Archive Index
              </p>
              <h1 className="mt-2 text-heading md:text-display-sm font-light tracking-[-0.03em]">
                All Artists.
              </h1>
            </div>
          </div>

          <ArtistsCatalogView artists={artistItems} />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
