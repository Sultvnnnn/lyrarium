import Link from "next/link";
import { Search, X } from "lucide-react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LyricPoster, type HeroItem } from "@/components/lyric-poster";

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
        s.artist.toLowerCase().includes(term),
    );
  }
  const hasFilter = Boolean(q || artist);

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      {/* 1 — Lyric Poster */}
      <section className="px-8 pt-16 pb-16">
        {heroItems.length ? (
          <LyricPoster items={heroItems} />
        ) : (
          <h1 className="text-heading font-light leading-heading tracking-[-0.023em] md:text-display md:leading-display md:tracking-[-0.04em]">
            Every word, preserved.
          </h1>
        )}
      </section>

      {/* 2 — Collection */}
      <section className="px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="text-caption uppercase text-muted-foreground">
              Collection
            </p>
            <h2 className="mt-4 text-heading-sm font-light tracking-[-0.02em]">
              {artist ? artist : "The archive."}
            </h2>
          </div>

          <form action="/" method="get" className="flex items-center gap-2">
            {artist && <input type="hidden" name="artist" value={artist} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search title / artist"
              className="h-10 w-48 border border-border bg-transparent px-4 text-body-sm placeholder:text-muted-foreground focus:border-accent md:w-64"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center border border-border text-foreground hover:border-accent hover:text-accent"
            >
              <Search size={16} strokeWidth={1} />
            </button>
            {hasFilter && (
              <Link
                href="/"
                aria-label="Clear filter"
                className="flex h-10 w-10 items-center justify-center border border-border text-foreground hover:border-accent hover:text-accent"
              >
                <X size={16} strokeWidth={1} />
              </Link>
            )}
          </form>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-16 text-body-sm text-muted-foreground">
            No lyrics found.
          </p>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-3">
            {filtered.map((song, i) => (
              <Link
                key={song.id}
                href={`/lyrics/${song.id}`}
                className="group block"
              >
                <article>
                  <div
                    className={`aspect-square ${i % 3 === 1 ? "border border-accent" : ""}`}
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

      {/* 3 — Artist Index */}
      <section className="px-8 pt-16">
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

      {/* 4 — Archive Stats */}
      <section className="px-8 pt-16 pb-16">
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
