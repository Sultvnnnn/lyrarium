import Link from "next/link";
import { X } from "lucide-react";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { songs, artists as artistsTable } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { HeroSearch } from "@/components/hero-search";
import { SongAccordion } from "@/components/song-accordion";
import { ArtistAccordion, type AccordionArtist } from "@/components/artist-accordion";
import { StatsLedger } from "@/components/stats-ledger";
import { SiteFooter } from "@/components/site-footer";
import type { HeroItem } from "@/components/lyric-poster";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; artist?: string }> };

export default async function Home({ searchParams }: Props) {
  const { q, artist } = await searchParams;
  // Order latest added songs first
  const all = await db.select().from(songs).orderBy(desc(songs.id));
  const allDbArtists = await db.select().from(artistsTable).orderBy(asc(artistsTable.name));

  const pool1: HeroItem[] = [];
  const pool2: HeroItem[] = [];
  const pool3: HeroItem[] = [];

  for (const s of all) {
    const rawLines = s.lyrics
      .split("\n")
      .map((l) => l.trim().replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, ""))
      .filter((l) => l.length > 0 && !l.startsWith("[") && !l.endsWith("]"));

    for (let i = 0; i < rawLines.length; i++) {
      const l1 = rawLines[i];

      // 1 baris
      if (l1.length >= 15 && l1.length <= 75) {
        pool1.push({
          id: s.id,
          title: s.title,
          artist: s.artist,
          lines: [l1],
          line: l1,
        });
      }

      // 2 baris berurutan
      if (i + 1 < rawLines.length) {
        const l2 = rawLines[i + 1];
        if (l1.length >= 10 && l1.length <= 60 && l2.length >= 10 && l2.length <= 60) {
          pool2.push({
            id: s.id,
            title: s.title,
            artist: s.artist,
            lines: [l1, l2],
            line: `${l1} / ${l2}`,
          });
        }
      }

      // 3 baris berurutan
      if (i + 2 < rawLines.length) {
        const l2 = rawLines[i + 1];
        const l3 = rawLines[i + 2];
        if (
          l1.length >= 8 && l1.length <= 50 &&
          l2.length >= 8 && l2.length <= 50 &&
          l3.length >= 8 && l3.length <= 50
        ) {
          pool3.push({
            id: s.id,
            title: s.title,
            artist: s.artist,
            lines: [l1, l2, l3],
            line: `${l1} / ${l2} / ${l3}`,
          });
        }
      }
    }
  }

  // Ambil sampling variatif 1, 2, dan 3 baris
  const shuffled1 = pool1.sort(() => Math.random() - 0.5).slice(0, 5);
  const shuffled2 = pool2.sort(() => Math.random() - 0.5).slice(0, 5);
  const shuffled3 = pool3.sort(() => Math.random() - 0.5).slice(0, 5);

  const heroItems: HeroItem[] = [...shuffled1, ...shuffled2, ...shuffled3]
    .sort(() => Math.random() - 0.5);

  const totalArtists = new Set(all.map((s) => s.artist.trim().toLowerCase()))
    .size;
  const totalWords = all.reduce(
    (acc, s) => acc + s.lyrics.split(/\s+/).filter(Boolean).length,
    0,
  );

  const artistMap = new Map<string, number>();
  for (const s of all)
    artistMap.set(s.artist.trim(), (artistMap.get(s.artist.trim()) ?? 0) + 1);
  const artistsList = [...artistMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  // Prepare ArtistAccordion items
  const artistAccordionItems: AccordionArtist[] = [];
  for (const a of allDbArtists) {
    const count = artistMap.get(a.name) ?? 0;
    artistAccordionItems.push({
      name: a.name,
      slug: a.slug,
      about: a.about,
      imageUrl: a.imageUrl,
      songCount: count,
    });
  }
  // Include any artist from songs not in artists table yet
  for (const [name, count] of artistsList) {
    if (!artistAccordionItems.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
      artistAccordionItems.push({
        name,
        slug: name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        about: null,
        imageUrl: null,
        songCount: count,
      });
    }
  }

  // Prepared artists with slugs for stats ledger
  const artistsForLedger = artistsList.map(([name, count]) => {
    const matched = allDbArtists.find(
      (a) => a.name.toLowerCase() === name.toLowerCase(),
    );
    return {
      name,
      slug:
        matched?.slug ??
        name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      count,
    };
  });

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
      {/* 1. Header with logo, add song/artist navigation, theme toggle, and menu */}
      <SiteHeader />

      {/* 2. Compact Search Box with speech-to-text mic & search icon */}
      <HeroSearch
        items={heroItems}
        initialQuery={q}
        artist={artist}
      />

      {/* 3. Recently Added (Accordion Card Strip — Horizontal on Desktop, Vertical on Mobile) */}
      <section id="collection" className="px-8 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-border pb-4 mb-8">
          <div>
            <p className="text-caption uppercase text-muted-foreground tracking-widest">
              Collection
            </p>
            <h2 className="mt-2 text-heading-sm font-light tracking-[-0.02em]">
              {artist ? `Recently Added — ${artist}.` : "Recently Added."}
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
          <div className="border border-border p-8 max-w-md">
            <p className="text-body-sm text-muted-foreground">
              {q
                ? `No lyrics found matching "${q}".`
                : "No lyrics found in the archive."}
            </p>
          </div>
        ) : (
          <SongAccordion songs={filtered} />
        )}
      </section>

      {/* 4. Artists Section (Distinct Artist Dossier Accordion Strip) */}
      <section id="artists" className="px-8 pt-20">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-border pb-4 mb-8">
          <div>
            <p className="text-caption uppercase text-muted-foreground tracking-widest">
              Archive Index
            </p>
            <h2 className="mt-2 text-heading-sm font-light tracking-[-0.02em]">
              Artists.
            </h2>
          </div>

          <span className="text-caption uppercase text-muted-foreground">
            {artistAccordionItems.length} {artistAccordionItems.length === 1 ? "profile" : "profiles"}
          </span>
        </div>

        {artistAccordionItems.length === 0 ? (
          <div className="border border-border p-8 max-w-md">
            <p className="text-body-sm text-muted-foreground">
              No artist dossiers registered yet.
            </p>
          </div>
        ) : (
          <ArtistAccordion artists={artistAccordionItems} />
        )}
      </section>

      {/* 5. Archive Stats Ledger */}
      <StatsLedger
        totalSongs={all.length}
        totalArtists={totalArtists}
        totalWords={totalWords}
        artists={artistsForLedger}
      />

      <SiteFooter />
    </main>
  );
}

