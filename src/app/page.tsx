import Link from "next/link";
import { X } from "lucide-react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { HeroSearch } from "@/components/hero-search";
import { SiteFooter } from "@/components/site-footer";
import type { HeroItem } from "@/components/lyric-poster";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; artist?: string }> };

export default async function Home({ searchParams }: Props) {
  const { q, artist } = await searchParams;
  const all = await db.select().from(songs).orderBy(asc(songs.id));

  const pool: HeroItem[] = [];
  for (const s of all) {
    const lines = s.lyrics
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= 15 && l.length <= 70);
    for (const line of lines) {
      pool.push({ id: s.id, title: s.title, artist: s.artist, line });
    }
  }
  const heroItems = pool.sort(() => Math.random() - 0.5).slice(0, 10);

  const totalArtists = new Set(all.map((s) => s.artist.trim().toLowerCase()))
    .size;
  const totalWords = all.reduce(
    (acc, s) => acc + s.lyrics.split(/\s+/).filter(Boolean).length,
    0,
  );

  const artistMap = new Map<string, number>();
  for (const s of all)
    artistMap.set(s.artist.trim(), (artistMap.get(s.artist.trim()) ?? 0) + 1);
  const artists = [...artistMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  let filtered = all;
  if (artist)
    filtered = filtered.filter(
      (s) => s.artist.trim().toLowerCase() === artist.toLowerCase(),
    );
  if (q) {
    const term = q.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.artist.toLowerCase().includes(term) ||
        s.lyrics.toLowerCase().includes(term),
    );
  }
  const hasFilter = Boolean(q || artist);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* 1. Header sebelumnya lengkap dengan logo, tagline, add song, menu, & ThemeToggle (dark mode) */}
      <SiteHeader />

      {/* 2. Searching Box jadi seperti di foto (dengan animated random lyric heading) */}
      <HeroSearch
        items={heroItems}
        initialQuery={q}
        artist={artist}
      />

        {/* 3. Collection */}
        <section id="collection" className="px-8 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-border pb-4">
            <div>
              <p className="text-caption uppercase text-muted-foreground">
                Collection
              </p>
              <h2 className="mt-2 text-heading-sm font-light tracking-[-0.02em]">
                {artist ? artist : "The archive."}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-caption uppercase text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "song" : "songs"}
              </span>
              {hasFilter && (
                <Link
                  href="/"
                  className="flex items-center gap-1 text-caption uppercase text-accent hover:underline"
                >
                  <X size={12} strokeWidth={1} /> Clear filter
                </Link>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-16 text-body-sm text-muted-foreground">
              {q
                ? `No lyrics found matching "${q}".`
                : "No lyrics found in the archive."}
            </p>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-3">
              {filtered.map((song, i) => (
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

        {/* 4. Artist Index */}
        <section id="artists" className="px-8 pt-20">
          <p className="text-caption uppercase text-muted-foreground">Index</p>
          <h2 className="mt-4 text-heading-sm font-light tracking-[-0.02em]">
            Artists.
          </h2>
          <div className="mt-12">
            {artists.map(([name, count]) => (
              <Link
                key={name}
                href={`/artist/${encodeURIComponent(name.toLowerCase().trim())}`}
                className="group flex items-baseline justify-between border-t border-border py-4 transition-all last:border-b hover:pl-4"
              >
                <span className="text-subheading font-light group-hover:text-accent">
                  {name}
                </span>
                <span className="text-caption uppercase text-muted-foreground">
                  {count} {count === 1 ? "song" : "songs"}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Archive Stats */}
        <section id="stats" className="px-8 pt-20 pb-16">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
            <div className="border-l border-accent pl-8">
              <p className="text-display font-light leading-display tracking-[-0.04em]">
                {all.length}
              </p>
              <p className="mt-4 text-caption uppercase text-muted-foreground">
                Songs archived
              </p>
            </div>
            <div className="border-l border-border pl-8">
              <p className="text-display font-light leading-display tracking-[-0.04em]">
                {totalArtists}
              </p>
              <p className="mt-4 text-caption uppercase text-muted-foreground">
                Artists
              </p>
            </div>
            <div className="border-l border-border pl-8">
              <p className="text-display font-light leading-display tracking-[-0.04em]">
                {totalWords.toLocaleString("id-ID")}
              </p>
              <p className="mt-4 text-caption uppercase text-muted-foreground">
                Words preserved
              </p>
            </div>
          </div>
        </section>

        <SiteFooter />
    </main>
  );
}
