import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { songs, artists } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LyricsCopy } from "@/components/lyrics-copy";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Disc } from "lucide-react";
import { parseCredits } from "@/lib/credits";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const song = await db.query.songs.findFirst({
    where: eq(songs.id, Number(id)),
  });
  return {
    title: song ? `${song.title} — ${song.artist}` : "Lyrarium",
  };
}

function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1).split("/")[0];
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2];
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2];
    }
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export default async function LyricsPage({ params }: Props) {
  const { id } = await params;
  const songId = Number(id);
  if (!Number.isInteger(songId)) notFound();

  const song = await db.query.songs.findFirst({ where: eq(songs.id, songId) });
  if (!song) notFound();

  const embedUrl = getYouTubeEmbedUrl(song.youtubeUrl);

  const all = await db.select().from(songs).orderBy(songs.id);
  const i = all.findIndex((s) => s.id === song.id);
  const prev = i > 0 ? all[i - 1] : null;
  const next = i >= 0 && i < all.length - 1 ? all[i + 1] : null;

  const artistRecord = await db.query.artists.findFirst({
    where: eq(artists.name, song.artist),
  });
  const artistBio = song.aboutArtist || artistRecord?.about || null;
  const artistSlug =
    artistRecord?.slug || encodeURIComponent(song.artist.toLowerCase().trim());
  const credits = parseCredits(song.credits);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Back to archive link */}
      <div className="px-8 pt-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-caption uppercase text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft
            size={16}
            strokeWidth={1}
            className="transition-transform group-hover:-translate-x-1"
          />
          <span>Archive</span>
        </Link>
      </div>

      {/* 1 — Integrated Gatefold Hero: Cover & Title Menyatu */}
      <section className="px-8 pt-6 pb-16 lg:pt-10 lg:pb-20">
        <div className="border border-border">
          {/* Top Panel: Cover & Title */}
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
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

              {/* Judul Display */}
              <div className="my-auto py-6">
                <h1 className="text-heading font-light leading-[0.9] tracking-[-0.035em] sm:text-7xl md:text-8xl xl:text-9xl">
                  {song.title}
                </h1>
              </div>

              {/* Bottom Tag / Indicator */}
              <div className="flex items-center gap-2 text-caption uppercase text-muted-foreground tracking-widest">
                <span className="size-1.5 bg-accent" />
                <span>Archive // Verified Lyrics</span>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Structured Credits (Album Liner Notes Aesthetic) */}
          {credits.length > 0 && (
            <div className="border-t border-border p-6 sm:p-8 lg:px-12 lg:py-8 bg-muted/10">
              <div className="flex items-center gap-2 text-caption uppercase text-muted-foreground mb-6">
                <Disc size={16} strokeWidth={1} />
                <span>Credits</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
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
        </div>
      </section>

      {/* 2 — Lirik + detail (sticky kanan) */}
      <section className="px-8 pt-4 pb-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_360px]">
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
          </div>

          {/* Detail sticky di kanan — bersih */}
          <aside className="flex flex-col gap-12 lg:sticky lg:top-16 lg:self-start">
            {/* YouTube embed */}
            {embedUrl && (
              <div>
                <p className="text-caption uppercase text-muted-foreground">
                  Music video
                </p>
                <iframe
                  src={embedUrl}
                  title={`${song.title} — ${song.artist}`}
                  className="mt-4 aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}

            {/* About artist */}
            {artistBio && (
              <div>
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
                  <span>Explore artist</span>
                  <ArrowRight size={16} strokeWidth={1} />
                </Link>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* 3 — Editorial prev/next nav */}
      <nav className="grid grid-cols-1 border-t border-border md:grid-cols-2">
        {prev ? (
          <Link
            href={`/lyrics/${prev.id}`}
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
          <span
            className="border-b border-border px-8 py-8 md:border-b-0 md:border-r"
            aria-hidden
          />
        )}

        {next ? (
          <Link
            href={`/lyrics/${next.id}`}
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
          <span aria-hidden />
        )}
      </nav>

      <SiteFooter />
    </main>
  );
}
