import { desc, asc } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { songs, artists } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { EditArchiveHub, type HubArtistItem } from "@/components/edit-archive-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Archive // Lyrarium",
  description: "Browse and select songs, lyrics, or artists to modify in the archive.",
};

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function EditHubPage({ searchParams }: Props) {
  const { type } = await searchParams;

  const [allSongs, allArtists] = await Promise.all([
    db.select().from(songs).orderBy(desc(songs.id)),
    db.select().from(artists).orderBy(asc(artists.name)),
  ]);

  // Aggregate song counts per artist
  const artistMap = new Map<string, number>();
  for (const s of allSongs) {
    const main = s.artist.trim();
    artistMap.set(main, (artistMap.get(main) ?? 0) + 1);
    if (s.featuring) {
      s.featuring.split(/,\s*/).forEach((f) => {
        const trimmed = f.trim();
        if (trimmed) {
          artistMap.set(trimmed, (artistMap.get(trimmed) ?? 0) + 1);
        }
      });
    }
  }

  const hubArtists: HubArtistItem[] = allArtists.map((a) => ({
    name: a.name,
    slug: a.slug,
    about: a.about,
    imageUrl: a.imageUrl,
    songCount: artistMap.get(a.name) ?? 0,
  }));

  // Include any artists from songs that might not yet have an artist record
  for (const [name, count] of artistMap.entries()) {
    if (!hubArtists.some((h) => h.name.toLowerCase() === name.toLowerCase())) {
      hubArtists.push({
        name,
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        about: null,
        imageUrl: null,
        songCount: count,
      });
    }
  }

  // Sort artists alphabetically
  hubArtists.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Breadcrumb navigation */}
      <div className="px-8 pt-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Edit Archive" },
          ]}
        />
      </div>

      <div className="px-8 pt-10 pb-24">
        {/* Editorial Section Header */}
        <div className="mb-10 border-b border-border pb-6">
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            Archive Maintenance // Directory
          </p>
          <h1 className="mt-4 text-heading font-light leading-heading tracking-[-0.023em] md:text-display md:leading-display md:tracking-[-0.04em]">
            Edit archive.
          </h1>
        </div>

        {/* Interactive Hub with Tabs & Cards */}
        <EditArchiveHub
          songs={allSongs}
          artists={hubArtists}
          initialTab={type === "artists" ? "artists" : "songs"}
        />
      </div>

      <SiteFooter />
    </main>
  );
}
