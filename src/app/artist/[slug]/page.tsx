import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc, or, ilike, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { songs, artists } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, Plus } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).trim();
  const slugified = decoded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const unhyphenated = decoded.replace(/-/g, " ").toLowerCase();

  const artistRecord = await db.query.artists.findFirst({
    where: or(
      eq(artists.slug, slugified),
      eq(artists.slug, decoded.toLowerCase()),
      ilike(artists.name, decoded),
      ilike(artists.name, unhyphenated)
    ),
  });
  const displayName =
    artistRecord?.name ??
    decoded
      .split(/[- ]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  return { title: `${displayName} — Lyrarium` };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).trim();
  const slugified = decoded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const unhyphenated = decoded.replace(/-/g, " ").toLowerCase();

  // Cari di tabel artists dengan slugified, unhyphenated, atau nama
  const artistRecord = await db.query.artists.findFirst({
    where: or(
      eq(artists.slug, slugified),
      eq(artists.slug, decoded.toLowerCase()),
      ilike(artists.name, decoded),
      ilike(artists.name, unhyphenated)
    ),
  });

  const displayName =
    artistRecord?.name ??
    decoded
      .split(/[- ]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Cari semua lagu dengan artist yang match (case-insensitive)
  const artistSongs = await db
    .select()
    .from(songs)
    .where(
      sql`LOWER(TRIM(${songs.artist})) = ${displayName.toLowerCase()}
       OR LOWER(REPLACE(TRIM(${songs.artist}), ' ', '-')) = ${slugified}
       OR LOWER(TRIM(${songs.artist})) = ${decoded.toLowerCase()}
       OR LOWER(TRIM(${songs.artist})) = ${unhyphenated}`
    )
    .orderBy(asc(songs.id));

  if (artistSongs.length === 0 && !artistRecord) notFound();

  // Ambil display name & about artist & image
  const totalWords = artistSongs.reduce(
    (acc, s) => acc + s.lyrics.split(/\s+/).filter(Boolean).length,
    0,
  );
  const aboutArtist = artistRecord?.about ?? artistSongs.find((s) => s.aboutArtist)?.aboutArtist;
  const artistImage =
    artistRecord?.imageUrl ||
    artistSongs.find((s) => s.imageUrl)?.imageUrl ||
    null;
  const backdropImage = artistImage;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top zone wrapping SiteHeader, navigation, and Hero spread to allow ambient photo bleed through header */}
      <div className="relative overflow-hidden">
        <SiteHeader />

        {/* Back to archive link */}
        <div className="relative z-10 px-8 pt-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-caption uppercase text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft
              size={16}
              strokeWidth={1}
              className="transition-colors group-hover:text-accent"
            />
            <span>Home</span>
          </Link>
        </div>

        {/* Artist Hero — Editorial Art-Book Spread */}
        <section className="relative px-8 pt-10 pb-16 border-b border-border">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-16 items-start">
            {/* Left Column: Title, Stats, and Bio */}
            <div className="flex flex-col gap-10">
              <div>
                <p className="text-caption uppercase text-muted-foreground tracking-widest">
                  Artist Profile
                </p>
                <h1 className="mt-4 text-heading font-light leading-heading tracking-[-0.023em] md:text-display md:leading-display md:tracking-[-0.04em]">
                  {displayName}
                </h1>
              </div>

              {/* Stats trio */}
              <div className="grid grid-cols-3 gap-6 sm:gap-8 max-w-xl">
                <div className="border-l border-accent pl-5">
                  <p className="text-heading-sm font-light leading-heading-sm tracking-[-0.02em]">
                    {artistSongs.length}
                  </p>
                  <p className="mt-2 text-caption uppercase text-muted-foreground">
                    Songs
                  </p>
                </div>
                <div className="border-l border-border pl-5">
                  <p className="text-heading-sm font-light leading-heading-sm tracking-[-0.02em]">
                    {totalWords.toLocaleString("id-ID")}
                  </p>
                  <p className="mt-2 text-caption uppercase text-muted-foreground">
                    Words
                  </p>
                </div>
                <div className="border-l border-border pl-5">
                  <p className="text-heading-sm font-light leading-heading-sm tracking-[-0.02em]">
                    {new Set(artistSongs.map((s) => s.title)).size}
                  </p>
                  <p className="mt-2 text-caption uppercase text-muted-foreground">
                    Tracks
                  </p>
                </div>
              </div>

              {/* About artist bio */}
              {aboutArtist && (
                <div className="border-t border-border pt-8 max-w-2xl">
                  <p className="text-caption uppercase text-muted-foreground tracking-wider mb-3">
                    About the Artist
                  </p>
                  <p className="text-body leading-relaxed text-muted-foreground whitespace-pre-line">
                    {aboutArtist}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Artist Portrait Art-Book Frame with Ambient Graduated Backdrop */}
            <div className="relative flex items-end gap-4 lg:self-start">
              {/* Portrait Wrapper */}
              <div className="relative size-64 sm:size-80 md:size-96 xl:size-[400px] shrink-0">
                {/* Ultra-smooth ambient graduated photo spreading softly through SiteHeader */}
                {backdropImage && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] md:w-[950px] xl:w-[1100px] h-[550px] sm:h-[750px] md:h-[950px] xl:h-[1100px] select-none"
                  >
                    <div
                      className="size-full bg-cover bg-center opacity-55 dark:opacity-70"
                      style={{
                        backgroundImage: `url(${backdropImage})`,
                        filter: "blur(10px)",
                        maskImage:
                          "radial-gradient(circle closest-side at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 72%, transparent 90%)",
                        WebkitMaskImage:
                          "radial-gradient(circle closest-side at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 72%, transparent 90%)",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                      }}
                    />
                  </div>
                )}

                {/* Foreground Portrait Frame */}
                <div className="relative z-10 size-full">
                  {artistImage ? (
                    <div className="size-full border border-border overflow-hidden bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={artistImage}
                        alt={displayName}
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="size-full border border-border bg-background flex flex-col justify-between p-8">
                      <span className="text-caption uppercase tracking-wider text-muted-foreground">
                        Archive // Portrait
                      </span>
                      <span className="text-display font-light text-muted-foreground/40 leading-none select-none">
                        {displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* All songs by artist (Discography) */}
      <section className="px-8 pt-16 pb-24">
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
          <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-3">
            {artistSongs.map((song, i) => (
              <Link
                key={song.id}
                href={`/lyrics/${song.id}`}
                className="group block"
              >
                <article>
                  <div
                    className={`aspect-square ${
                      i % 3 === 1 ? "border border-accent" : ""
                    }`}
                  >
                    {song.imageUrl ? (
                      <img
                        src={song.imageUrl}
                        alt={`${song.title} — ${song.artist}`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex size-full items-end p-6 ${
                          i % 3 === 1
                            ? "bg-accent"
                            : "border border-border"
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
                    )}
                  </div>
                  <h3 className="mt-4 text-subheading font-light transition-colors group-hover:text-accent">
                    {song.title}
                  </h3>
                  <p className="mt-1 text-caption uppercase text-muted-foreground">
                    {song.artist}
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
