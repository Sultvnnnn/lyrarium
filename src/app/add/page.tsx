import { asc, desc, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { artists, songs } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AddSongForm, type ExistingArtwork } from "@/components/add-song-form";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; artist?: string; target?: string }>;
};

export default async function AddPage({ searchParams }: Props) {
  const { error, artist, target } = await searchParams;

  // Ambil semua artis dan artwork lagu eksisting dari database
  const [allArtists, songArtworks] = await Promise.all([
    db
      .select({ name: artists.name })
      .from(artists)
      .orderBy(asc(artists.name)),
    db
      .select({
        id: songs.id,
        title: songs.title,
        artist: songs.artist,
        album: songs.album,
        imageUrl: songs.imageUrl,
      })
      .from(songs)
      .where(isNotNull(songs.imageUrl))
      .orderBy(desc(songs.createdAt)),
  ]);

  const artistsList = allArtists.map((a) => a.name);

  // Deduplikasi artwork berdasarkan imageUrl
  const seenUrls = new Set<string>();
  const existingArtworks: ExistingArtwork[] = [];
  for (const s of songArtworks) {
    if (s.imageUrl && !seenUrls.has(s.imageUrl)) {
      seenUrls.add(s.imageUrl);
      existingArtworks.push({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        imageUrl: s.imageUrl,
      });
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Breadcrumb navigation */}
      <div className="px-8 pt-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Add Song" },
          ]}
        />
      </div>

      <div className="px-8 pt-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-16 xl:gap-24">
          {/* Left Column: Minimalist Editorial Title */}
          <aside className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
            <div>
              <p className="text-caption uppercase text-muted-foreground tracking-widest">
                Archive Entry // New
              </p>
              <h1 className="mt-4 text-heading font-light leading-heading tracking-[-0.023em] md:text-display md:leading-display md:tracking-[-0.04em]">
                Add a song.
              </h1>
            </div>
          </aside>

          {/* Right Column: Structured Form */}
          <div className="max-w-3xl">
            <AddSongForm
              error={error}
              artistsList={artistsList}
              existingArtworks={existingArtworks}
              initialArtist={artist}
              target={target}
            />
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
