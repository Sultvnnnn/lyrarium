import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, or, ilike, asc, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { songs, artists, lyraInsights } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LyricsCopy } from "@/components/lyrics-copy";
import { LyricsBreadcrumb } from "@/components/lyrics-breadcrumb";
import { YouTubeCarousel } from "@/components/youtube-carousel";
import { parseYouTubeVideos } from "@/lib/youtube";
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, Pencil, Minus } from "lucide-react";
import { parseCredits } from "@/lib/credits";
import { AskLyra } from "@/components/ask-lyra";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; artist?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const song = await db.query.songs.findFirst({
    where: eq(songs.id, Number(id)),
  });
  return {
    title: song ? `${song.title} — ${song.artist}` : "Lyrarium",
  };
}

function getDynamicTitleSize(title: string): string {
  const trimmed = title.trim();
  const len = trimmed.length;
  const maxWordLen = Math.max(...trimmed.split(/\s+/).map((w) => w.length), 0);

  // Very short: 1–8 characters (e.g. "Loser", "2001x", "Alamak")
  if (len <= 8 && maxWordLen <= 8) {
    return "text-6xl sm:text-7xl md:text-8xl xl:text-9xl leading-[0.9]";
  }
  // Short: 9–15 characters (e.g. "Menawan", "Starboy")
  if (len <= 15 && maxWordLen <= 12) {
    return "text-5xl sm:text-6xl md:text-7xl xl:text-8xl leading-[0.92]";
  }
  // Medium: 16–25 characters (e.g. "Bohemian Rhapsody", "Harap-Harap Cemas")
  if (len <= 25 && maxWordLen <= 16) {
    return "text-4xl sm:text-5xl md:text-6xl xl:text-7xl leading-[0.95]";
  }
  // Long: 26–38 characters (e.g. "The Less I Know the Better")
  if (len <= 38) {
    return "text-3xl sm:text-4xl md:text-5xl xl:text-6xl leading-[1.02]";
  }
  // Very long: > 38 characters
  return "text-2xl sm:text-3xl md:text-4xl xl:text-5xl leading-[1.08]";
}

export default async function LyricsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { from, artist: queryArtist } = await searchParams;
  const songId = Number(id);
  if (!Number.isInteger(songId)) notFound();

  const song = await db.query.songs.findFirst({ where: eq(songs.id, songId) });
  if (!song) notFound();

  const youtubeVideos = parseYouTubeVideos(song.youtubeUrl);

  const artistSlugified = song.artist
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const artistRecord = await db.query.artists.findFirst({
    where: or(
      ilike(artists.name, song.artist.trim()),
      eq(artists.slug, artistSlugified)
    ),
  });
  const artistBio = artistRecord?.about || song.aboutArtist || null;
  const artistSlug = artistRecord?.slug || artistSlugified;
  const credits = parseCredits(song.credits);

  // Pre-fetch cached Lyra insights (if available) for client cache hydration
  const existingInsights = await db.query.lyraInsights.findMany({
    where: eq(lyraInsights.songId, song.id),
  });
  const idInsight = existingInsights.find((i) => i.language === "id");
  const enInsight = existingInsights.find((i) => i.language === "en");
  const initialInsights = {
    id: idInsight
      ? {
          content: idInsight.content,
          createdAt: idInsight.createdAt,
        }
      : null,
    en: enInsight
      ? {
          content: enInsight.content,
          createdAt: enInsight.createdAt,
        }
      : null,
  };

  // Tentukan scoped artist untuk navigasi prev/next:
  // Termasuk lagu original si artist dan juga lagu featuring (misal Le Sserafim ft. Katseye masuk scope Katseye).
  let targetArtistQuery = queryArtist?.trim() || song.artist.trim();
  let targetArtistSlugified = targetArtistQuery
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  let targetArtistUnhyphenated = targetArtistQuery.replace(/-/g, " ").toLowerCase();

  let targetArtistRecord = await db.query.artists.findFirst({
    where: or(
      eq(artists.slug, targetArtistSlugified),
      eq(artists.slug, targetArtistQuery.toLowerCase()),
      ilike(artists.name, targetArtistQuery),
      ilike(artists.name, targetArtistUnhyphenated)
    ),
  });

  let scopedArtistName = targetArtistRecord?.name || targetArtistQuery;
  let scopedArtistSlug = targetArtistRecord?.slug || targetArtistSlugified;

  const fetchArtistScopedSongs = async (name: string, slug: string, rawQuery: string) => {
    const nameLower = name.toLowerCase().trim();
    const rawLower = rawQuery.toLowerCase().trim();
    const unhyphenated = rawQuery.replace(/-/g, " ").toLowerCase().trim();

    return db
      .select()
      .from(songs)
      .where(
        sql`LOWER(TRIM(${songs.artist})) = ${nameLower}
         OR LOWER(REPLACE(TRIM(${songs.artist}), ' ', '-')) = ${slug}
         OR LOWER(TRIM(${songs.artist})) = ${rawLower}
         OR LOWER(TRIM(${songs.artist})) = ${unhyphenated}
         OR LOWER(COALESCE(${songs.featuring}, '')) ILIKE ${`%${nameLower}%`}
         OR LOWER(COALESCE(${songs.featuring}, '')) ILIKE ${`%${rawLower}%`}
         OR LOWER(COALESCE(${songs.featuring}, '')) ILIKE ${`%${unhyphenated}%`}
         OR LOWER(COALESCE(${songs.credits}, '')) ILIKE ${`%${nameLower}%`}
         OR LOWER(COALESCE(${songs.credits}, '')) ILIKE ${`%${rawLower}%`}`
      )
      .orderBy(asc(songs.id));
  };

  let artistSongs = await fetchArtistScopedSongs(
    scopedArtistName,
    scopedArtistSlug,
    targetArtistQuery
  );

  let i = artistSongs.findIndex((s) => s.id === song.id);

  // Jika lagu yang dibuka bukan bagian dari scope queryArtist, fallback ke artist utama lagu ini
  if (i === -1 && queryArtist) {
    scopedArtistName = artistRecord?.name || song.artist.trim();
    scopedArtistSlug = artistRecord?.slug || artistSlugified;
    targetArtistQuery = song.artist.trim();
    artistSongs = await fetchArtistScopedSongs(
      scopedArtistName,
      scopedArtistSlug,
      targetArtistQuery
    );
    i = artistSongs.findIndex((s) => s.id === song.id);
  }

  const prev = i > 0 ? artistSongs[i - 1] : null;
  const next = i >= 0 && i < artistSongs.length - 1 ? artistSongs[i + 1] : null;

  const createNavHref = (targetId: number) => {
    const navParams = new URLSearchParams();
    if (from === "artist") {
      navParams.set("from", "artist");
    } else if (from === "songs") {
      navParams.set("from", "songs");
    }
    if (scopedArtistSlug) {
      navParams.set("artist", scopedArtistSlug);
    }
    const qs = navParams.toString();
    return `/lyrics/${targetId}${qs ? `?${qs}` : ""}`;
  };

  // Fetch featuring artists
  const rawFeaturing = song.featuring || "";
  const featuringNames = rawFeaturing
    ? rawFeaturing.split(/,\s*/).map((s) => s.trim()).filter(Boolean)
    : [];

  const allFeaturingArtists = await Promise.all(
    featuringNames.map(async (name) => {
      const featSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const rec = await db.query.artists.findFirst({
        where: or(
          ilike(artists.name, name),
          eq(artists.slug, featSlug)
        ),
      });
      return {
        name,
        slug: rec?.slug || featSlug,
        about: rec?.about || null,
      };
    })
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Breadcrumb navigation */}
      <div className="px-8 pt-8">
        <LyricsBreadcrumb
          songTitle={song.title}
          artistName={song.artist}
          artistSlug={artistSlug}
          fromParam={from}
          featuringArtists={allFeaturingArtists}
          scopedArtistName={scopedArtistName}
          scopedArtistSlug={scopedArtistSlug}
        />
      </div>

      {/* 1 — Integrated Gatefold Hero: Cover & Title Menyatu */}
      <section className="px-8 pt-6 pb-16 lg:pt-10 lg:pb-20">
        <div className="border border-border grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
          {/* Sisi Kiri: 1:1 Cover Square Utuh murni */}
          <div className="relative border-b lg:border-b-0 lg:border-r border-border bg-muted/20">
            <div className="size-full aspect-square min-h-[360px] sm:min-h-[400px] xl:min-h-[440px]">
              {song.imageUrl ? (
                <img
                  src={song.imageUrl}
                  alt={`${song.title} — ${song.artist}`}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-end p-8">
                  <span className="text-display font-light leading-display tracking-[-0.04em]">
                    {song.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Panel Tipografi Artist & Judul */}
          <div className="flex flex-col justify-between p-8 sm:p-10 lg:p-12 xl:p-14">
            <div>
              <div className="flex items-center gap-2 text-caption uppercase text-muted-foreground">
                <span>Artist</span>
                <span>//</span>
                <Link
                  href={`/artist/${artistSlug}`}
                  className="text-foreground transition-colors hover:text-accent hover:underline underline-offset-4"
                >
                  {song.artist}
                </Link>
              </div>

              {/* Judul Display + Featuring Artist */}
              <div className="mt-8">
                <div className="flex flex-wrap items-baseline gap-x-4 sm:gap-x-6 gap-y-2">
                  <h1
                    className={`${getDynamicTitleSize(
                      song.title
                    )} font-light tracking-[-0.035em] break-words`}
                  >
                    {song.title}
                  </h1>
                  {allFeaturingArtists.length > 0 && (
                    <span className="inline-flex flex-wrap items-baseline gap-2 text-caption uppercase text-muted-foreground">
                      <span>//</span>
                      <span>feat.</span>
                      {allFeaturingArtists.map((feat, idx) => (
                        <span key={feat.name} className="inline-flex items-baseline gap-1">
                          <Link
                            href={`/artist/${feat.slug}`}
                            className="text-foreground transition-colors hover:text-accent hover:underline underline-offset-4"
                          >
                            {feat.name}
                          </Link>
                          {idx < allFeaturingArtists.length - 1 && (
                            <span>,</span>
                          )}
                        </span>
                      ))}
                    </span>
                  )}
                </div>

                {/* Album Metadata below song title */}
                {song.album && (
                  <div className="mt-4 flex items-center gap-2 text-caption uppercase text-muted-foreground">
                    <span>Album</span>
                    <span>//</span>
                    <Link
                      href={`/artist/${artistSlug}?album=${encodeURIComponent(song.album)}#discography`}
                      className="text-foreground transition-colors hover:text-accent hover:underline underline-offset-4"
                    >
                      {song.album}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Scroll to Lyrics & Edit Entry */}
            <div className="mt-8 pt-4 flex flex-wrap items-center gap-3">
              <a
                href="#lyrics"
                className="group inline-flex items-center gap-2.5 border border-border bg-background px-4 py-2.5 text-caption uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent active:scale-95"
              >
                <span>To lyrics</span>
                <ArrowDown
                  size={16}
                  strokeWidth={1}
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                />
              </a>

              <Link
                href={`/lyrics/${song.id}/edit`}
                className="group inline-flex items-center gap-2 border border-border bg-background px-4 py-2.5 text-caption uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent hover:text-accent active:scale-95"
              >
                <Pencil size={16} strokeWidth={1} />
                <span>Edit Entry</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Lirik + detail (sticky kanan) */}
      <section id="lyrics" className="scroll-mt-8 px-8 pt-4 pb-24">
        <div className="grid grid-cols-1 gap-16 lyrics-grid-layout">
          {/* Kolom lirik */}
          <div>
            <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
              <p className="text-caption uppercase text-muted-foreground">
                Lyrics
              </p>
              <LyricsCopy lyrics={song.lyrics} />
            </div>

            <div className="border-l border-accent pl-8">
              <p className="whitespace-pre-line text-body font-normal leading-body text-foreground">
                {song.lyrics}
              </p>
            </div>

            {/* Structured Credits di akhir lirik */}
            {credits.length > 0 && (
              <div className="mt-16 pt-8 border-t border-border">
                <p className="text-caption uppercase text-muted-foreground tracking-widest mb-6">
                  Credits
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
                  {credits.map((c, idx) => (
                    <div
                      key={idx}
                      className="group border-l border-border hover:border-accent pl-3.5 transition-colors"
                    >
                      <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                        {c.role}
                      </span>
                      <span className="block mt-1 text-body-sm font-light text-foreground group-hover:text-accent transition-colors">
                        {c.names.join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lyra Interpretation (Ask Lyra) — scrolls alongside sticky video and about artist sidebar */}
            <div className="mt-16 pt-16 border-t border-border">
              <AskLyra
                songId={song.id}
                songTitle={song.title}
                artist={song.artist}
                lyricsExcerpt={song.lyrics.slice(0, 300)}
                initialInsights={initialInsights}
              />
            </div>
          </div>

          {/* Detail sticky di kanan — bersih */}
          <aside className="flex flex-col items-end gap-12 lg:sticky lg:top-16 lg:self-start">
            {/* YouTube videos carousel */}
            {youtubeVideos.length > 0 && (
              <YouTubeCarousel
                videos={youtubeVideos}
                songTitle={song.title}
                artistName={song.artist}
              />
            )}

            {/* About artist */}
            {artistBio && (
              <div
                className="self-end w-[360px] max-w-full text-left"
                style={{ width: "360px", maxWidth: "100%" }}
              >
                <p className="text-caption uppercase text-muted-foreground">
                  About the artist
                </p>
                <p className="mt-4 text-body-sm leading-body-sm text-muted-foreground">
                  {artistBio}
                </p>
                <Link
                  href={`/artist/${artistSlug}`}
                  className="mt-4 inline-flex items-center gap-1 text-caption uppercase text-foreground transition-colors hover:text-accent"
                >
                  <span>Explore {song.artist}</span>
                  <ArrowRight size={16} strokeWidth={1} />
                </Link>
              </div>
            )}

            {/* About featuring artists */}
            {allFeaturingArtists.map(
              (feat) =>
                feat.about && (
                  <div
                    key={feat.name}
                    className="self-end border-t border-border pt-6 w-[360px] max-w-full text-left"
                    style={{ width: "360px", maxWidth: "100%" }}
                  >
                    <p className="text-caption uppercase text-muted-foreground">
                      About {feat.name}
                    </p>
                    <p className="mt-4 text-body-sm leading-body-sm text-muted-foreground">
                      {feat.about}
                    </p>
                    <Link
                      href={`/artist/${feat.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-caption uppercase text-foreground transition-colors hover:text-accent"
                    >
                      <span>Explore {feat.name}</span>
                      <ArrowRight size={16} strokeWidth={1} />
                    </Link>
                  </div>
                )
            )}
          </aside>
        </div>
      </section>

      {/* 4 — Editorial prev/next nav (hanya lagu terkait artis ini) */}
      <nav className="grid grid-cols-1 border-t border-border md:grid-cols-2">
        {prev ? (
          <Link
            href={createNavHref(prev.id)}
            className="group flex items-center gap-6 border-b border-border px-8 py-8 md:border-b-0 md:border-r"
          >
            <ChevronLeft
              size={16}
              strokeWidth={1}
              className="shrink-0 text-muted-foreground transition-colors group-hover:text-accent"
            />
            <span className="min-w-0">
              <span className="block text-caption uppercase text-muted-foreground">
                Previous
              </span>
              <span className="mt-2 block truncate text-subheading font-light transition-colors group-hover:text-accent">
                {prev.title}
              </span>
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-6 border-b border-border px-8 py-8 md:border-b-0 md:border-r select-none">
            <Minus
              size={16}
              strokeWidth={1}
              className="shrink-0 text-muted-foreground/30"
            />
            <span className="min-w-0">
              <span className="block text-caption uppercase text-muted-foreground/50">
                Previous
              </span>
              <span className="mt-2 block truncate text-subheading font-light text-muted-foreground/50">
                First entry.
              </span>
            </span>
          </div>
        )}

        {next ? (
          <Link
            href={createNavHref(next.id)}
            className="group flex items-center justify-end gap-6 px-8 py-8 text-right"
          >
            <span className="min-w-0">
              <span className="block text-caption uppercase text-muted-foreground">
                Next
              </span>
              <span className="mt-2 block truncate text-subheading font-light transition-colors group-hover:text-accent">
                {next.title}
              </span>
            </span>
            <ChevronRight
              size={16}
              strokeWidth={1}
              className="shrink-0 text-muted-foreground transition-colors group-hover:text-accent"
            />
          </Link>
        ) : (
          <div className="flex items-center justify-end gap-6 px-8 py-8 text-right select-none">
            <span className="min-w-0">
              <span className="block text-caption uppercase text-muted-foreground/50">
                Next
              </span>
              <span className="mt-2 block truncate text-subheading font-light text-muted-foreground/50">
                Latest entry.
              </span>
            </span>
            <Minus
              size={16}
              strokeWidth={1}
              className="shrink-0 text-muted-foreground/30"
            />
          </div>
        )}
      </nav>

      <SiteFooter />
    </main>
  );
}
