import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { songs, artists } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, Plus } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = decodeURIComponent(slug).toLowerCase().trim();
  const artistRecord = await db.query.artists.findFirst({
    where: eq(artists.slug, normalizedSlug),
  });
  const displayName =
    artistRecord?.name ??
    decodeURIComponent(slug)
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  return { title: `${displayName} — Lyrarium` };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const normalizedSlug = decodeURIComponent(slug).toLowerCase().trim();

  // Cari di tabel artists
  const artistRecord = await db.query.artists.findFirst({
    where: eq(artists.slug, normalizedSlug),
  });

  // Cari semua lagu dengan artist yang match (case-insensitive)
  const artistSongs = await db
    .select()
    .from(songs)
    .where(sql`LOWER(TRIM(${songs.artist})) = ${normalizedSlug}`)
    .orderBy(asc(songs.id));

  if (artistSongs.length === 0 && !artistRecord) notFound();

  // Ambil display name & about artist
  const displayName = artistRecord?.name ?? artistSongs[0]?.artist.trim();
  const totalWords = artistSongs.reduce(
    (acc, s) => acc + s.lyrics.split(/\s+/).filter(Boolean).length,
    0,
  );
  const aboutArtist = artistRecord?.about ?? artistSongs.find((s) => s.aboutArtist)?.aboutArtist;

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="px-8 pt-16 pb-16">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-body-sm underline-offset-4 hover:text-accent hover:underline"
        >
          <ArrowLeft
            size={16}
            strokeWidth={1}
            className="transition-colors group-hover:text-accent"
          />
          All artists
        </Link>

        <p className="mt-12 text-caption uppercase text-muted-foreground">
          Artist
        </p>
        <h1 className="mt-6 text-heading font-light leading-heading tracking-[-0.023em] md:text-display md:leading-display md:tracking-[-0.04em]">
          {displayName}
        </h1>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-8">
          <div className="border-l border-accent pl-6">
            <p className="text-heading-sm font-light leading-heading-sm tracking-[-0.02em]">
              {artistSongs.length}
            </p>
            <p className="mt-2 text-caption uppercase text-muted-foreground">
              Songs
            </p>
          </div>
          <div className="border-l border-border pl-6">
            <p className="text-heading-sm font-light leading-heading-sm tracking-[-0.02em]">
              {totalWords.toLocaleString("id-ID")}
            </p>
            <p className="mt-2 text-caption uppercase text-muted-foreground">
              Words
            </p>
          </div>
          <div className="border-l border-border pl-6">
            <p className="text-heading-sm font-light leading-heading-sm tracking-[-0.02em]">
              {new Set(artistSongs.map((s) => s.title)).size}
            </p>
            <p className="mt-2 text-caption uppercase text-muted-foreground">
              Unique tracks
            </p>
          </div>
        </div>
      </section>

      {/* About artist */}
      {aboutArtist && (
        <section className="px-8 pb-16">
          <p className="text-caption uppercase text-muted-foreground">About</p>
          <p className="mt-4 max-w-2xl text-body leading-body text-muted-foreground">
            {aboutArtist}
          </p>
        </section>
      )}

      {/* All songs by artist */}
      <section className="px-8 pb-24">
        <p className="text-caption uppercase text-muted-foreground">
          Discography
        </p>
        <h2 className="mt-4 text-heading-sm font-light tracking-[-0.02em]">
          All songs by {displayName}.
        </h2>

        {artistSongs.length === 0 ? (
          <div className="mt-12 border border-border p-8 max-w-md">
            <p className="text-body-sm text-muted-foreground">
              No songs archived yet for {displayName}.
            </p>
            <Link
              href={`/add?artist=${encodeURIComponent(displayName)}`}
              className="mt-6 inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2.5 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
            >
              <Plus size={16} strokeWidth={1} />
              <span>Add a song for {displayName}</span>
            </Link>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-3">
            {artistSongs.map((song, i) => (
              <Link
                key={song.id}
                href={`/lyrics/${song.id}`}
                className="group block"
              >
                <article>
                  <div
                    className={`flex aspect-square items-end p-6 ${
                      i % 3 === 1 ? "bg-accent" : "border border-border"
                    }`}
                  >
                    <span
                      className={`text-heading font-light tracking-[-0.023em] ${
                        i % 3 === 1 ? "text-accent-foreground" : ""
                      }`}
                    >
                      {song.title.charAt(0)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-subheading font-light group-hover:text-accent">
                    {song.title}
                  </h3>
                  <p className="mt-1 text-caption uppercase text-muted-foreground">
                    {song.artist}
                  </p>
                  <p className="mt-2 line-clamp-3 text-body-sm leading-body-sm text-muted-foreground">
                    {song.lyrics}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
