import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const song = await db.query.songs.findFirst({
    where: eq(songs.id, Number(id)),
  });
  return { title: song ? `${song.title} — Lyrarium` : "Lyrarium" };
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

  // FIX: check null SEBELUM akses property
  const song = await db.query.songs.findFirst({ where: eq(songs.id, songId) });
  if (!song) notFound();

  const embedUrl = getYouTubeEmbedUrl(song.youtubeUrl);

  const all = await db.select().from(songs).orderBy(songs.id);
  const i = all.findIndex((s) => s.id === song.id);
  const prev = all[i - 1];
  const next = all[i + 1];

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      {/* 1 — Art-book spread: type kiri, cover square kanan */}
      <section className="px-8 pt-16 pb-16 lg:pt-24 lg:pb-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          {/* Type field */}
          <div className="order-2 lg:order-1">
            <p className="text-caption uppercase text-muted-foreground">
              {song.artist}
            </p>
            <h1 className="mt-6 max-w-4xl text-heading font-light leading-heading tracking-[-0.023em] md:text-display md:leading-display md:tracking-[-0.04em]">
              {song.title}
            </h1>
            <div className="mt-8 flex gap-2">
              <span className="rounded-pills border border-border px-3 py-2 text-caption uppercase">
                Lyrics
              </span>
              <span className="rounded-pills bg-accent px-3 py-2 text-caption uppercase text-accent-foreground">
                Archive
              </span>
            </div>
          </div>

          {/* Cover square utuh + meta vertikal */}
          <div className="order-1 flex items-end gap-6 lg:order-2">
            <span className="hidden shrink-0 rotate-180 text-caption uppercase text-muted-foreground [writing-mode:vertical-rl] lg:block">
              Cover — {song.artist}
            </span>
            {song.imageUrl ? (
              <img
                src={song.imageUrl}
                alt={`${song.title} — ${song.artist}`}
                className="aspect-square w-full max-w-105 object-cover lg:w-95 lg:max-w-none xl:w-115"
              />
            ) : (
              <div className="flex aspect-square w-full max-w-105 items-end border border-border p-6 lg:w-95 lg:max-w-none xl:w-115">
                <span className="text-display font-light leading-display tracking-[-0.04em]">
                  {song.title.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2 — Lirik + detail (sticky kanan) */}
      <section className="px-8 pt-16 pb-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Lirik — hairline aksen tema */}
          <div className="border-l border-accent pl-8">
            <p className="whitespace-pre-line text-body leading-body text-foreground">
              {song.lyrics}
            </p>
          </div>

          {/* Detail — sticky di kanan */}
          <aside className="flex flex-col gap-12 lg:sticky lg:top-16 lg:self-start">
            {/* YouTube embed — paling atas */}
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

            {song.aboutArtist && (
              <div>
                <p className="text-caption uppercase text-muted-foreground">
                  About the artist
                </p>
                <p className="mt-4 text-body-sm leading-body-sm text-muted-foreground">
                  {song.aboutArtist}
                </p>
              </div>
            )}

            {song.credits && (
              <div>
                <p className="text-caption uppercase text-muted-foreground">
                  Credits
                </p>
                <p className="mt-4 whitespace-pre-line text-body-sm leading-body-sm text-foreground">
                  {song.credits}
                </p>
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
