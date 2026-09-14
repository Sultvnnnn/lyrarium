import { notFound } from "next/navigation";
import { asc, desc, eq, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { songs, artists } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { EditSongForm, type ExistingArtwork } from "@/components/edit-song-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const songId = Number(id);
  if (isNaN(songId)) return { title: "Edit Song // Lyrarium" };

  const song = await db.query.songs.findFirst({
    where: eq(songs.id, songId),
  });

  if (!song) return { title: "Edit Song // Lyrarium" };

  return {
    title: `Edit: ${song.title} — ${song.artist} // Lyrarium`,
    description: `Edit lyrics and liner credits for ${song.title} by ${song.artist}.`,
  };
}

export default async function EditSongPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const songId = Number(id);

  if (isNaN(songId)) {
    notFound();
  }

  const [song, allArtists, songArtworks] = await Promise.all([
    db.query.songs.findFirst({
      where: eq(songs.id, songId),
    }),
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

  if (!song) {
    notFound();
  }

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
            { label: "Lyrics", href: "/#collection" },
            { label: song.title, href: `/lyrics/${song.id}` },
            { label: "Edit" },
          ]}
        />
      </div>

      <div className="px-8 pt-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-16 xl:gap-24">
          {/* Left Column: Minimalist Editorial Title */}
          <aside className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
            <div>
              <p className="text-caption uppercase text-muted-foreground tracking-widest">
                Archive Entry // Edit
              </p>
              <h1 className="mt-4 text-heading font-light leading-heading tracking-[-0.023em] md:text-display md:leading-display md:tracking-[-0.04em]">
                Edit song.
              </h1>
            </div>
          </aside>

          {/* Right Column: Structured Edit Form */}
          <div className="max-w-3xl">
            <EditSongForm
              song={song}
              artistsList={artistsList}
              existingArtworks={existingArtworks}
              error={error}
            />
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
