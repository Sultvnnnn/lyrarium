"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { Song } from "@/db/schema";

const ALPHABET = [
  "ALL",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "#",
];

const ITEMS_PER_ROW = 6;

type SongsCatalogViewProps = {
  songs: Song[];
};

export function SongsCatalogView({ songs }: SongsCatalogViewProps) {
  const [selectedLetter, setSelectedLetter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Letter distribution counts
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: songs.length };
    for (const letter of ALPHABET) {
      if (letter !== "ALL") counts[letter] = 0;
    }

    for (const song of songs) {
      const firstChar = song.title.trim().charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstChar)) {
        counts[firstChar] = (counts[firstChar] || 0) + 1;
      } else {
        counts["#"] = (counts["#"] || 0) + 1;
      }
    }
    return counts;
  }, [songs]);

  // Filtered and sorted songs (sorted alphabetically by title)
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      // 1. Alphabet filter
      if (selectedLetter !== "ALL") {
        const firstChar = song.title.trim().charAt(0).toUpperCase();
        if (selectedLetter === "#") {
          if (/[A-Z]/.test(firstChar)) return false;
        } else {
          if (firstChar !== selectedLetter) return false;
        }
      }

      // 2. Search query filter
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchTitle = song.title.toLowerCase().includes(term);
        const matchArtist = song.artist.toLowerCase().includes(term);
        const matchFeat = song.featuring?.toLowerCase().includes(term) ?? false;
        const matchAlbum = song.album?.toLowerCase().includes(term) ?? false;
        const matchLyrics = song.lyrics.toLowerCase().includes(term);
        return matchTitle || matchArtist || matchFeat || matchAlbum || matchLyrics;
      }

      return true;
    });
  }, [songs, selectedLetter, search]);

  // Chunk songs into rows of 6 items
  const songChunks = useMemo(() => {
    const chunks: Song[][] = [];
    for (let i = 0; i < filteredSongs.length; i += ITEMS_PER_ROW) {
      chunks.push(filteredSongs.slice(i, i + ITEMS_PER_ROW));
    }
    return chunks;
  }, [filteredSongs]);

  return (
    <div className="w-full space-y-10">
      {/* Controls Bar: Search & Alphabet Filter */}
      <div className="space-y-6">
        {/* Search Input Box */}
        <div className="flex items-center justify-between gap-4 border border-border bg-muted/20 px-4 py-3">
          <div className="flex flex-1 items-center gap-3">
            <Search size={16} strokeWidth={1} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, artist, album, or lyrics..."
              className="w-full bg-transparent text-body-sm font-light text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              <X size={16} strokeWidth={1} />
            </button>
          )}
        </div>

        {/* Alphabet Filter Strip */}
        <div className="border border-border p-2 bg-background">
          <div className="flex flex-wrap items-center gap-1">
            {ALPHABET.map((letter) => {
              const count = letterCounts[letter] || 0;
              const isSelected = selectedLetter === letter;
              const hasItems = count > 0;

              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setSelectedLetter(letter)}
                  disabled={!hasItems && letter !== "ALL"}
                  className={`relative flex items-center justify-center min-w-[36px] h-9 px-2 text-caption uppercase tracking-wider transition-colors select-none ${
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : hasItems || letter === "ALL"
                      ? "text-foreground hover:bg-muted hover:text-accent"
                      : "text-muted-foreground/30 cursor-not-allowed"
                  }`}
                  title={letter === "ALL" ? "All songs" : `${letter} (${count})`}
                >
                  <span>{letter}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Counter & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3 text-caption uppercase tracking-widest text-muted-foreground">
          <span>
            Showing {filteredSongs.length} of {songs.length} {songs.length === 1 ? "track" : "tracks"}
          </span>
          {selectedLetter !== "ALL" && (
            <>
              <span>//</span>
              <span className="text-foreground">Letter: {selectedLetter}</span>
            </>
          )}
          {search && (
            <>
              <span>//</span>
              <span className="text-foreground">Query: &quot;{search}&quot;</span>
            </>
          )}
        </div>

        {(selectedLetter !== "ALL" || search) && (
          <button
            type="button"
            onClick={() => {
              setSelectedLetter("ALL");
              setSearch("");
            }}
            className="flex items-center gap-1.5 text-caption uppercase tracking-widest text-accent hover:underline"
          >
            <X size={16} strokeWidth={1} />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Song Cards: Accordion Strips */}
      {filteredSongs.length === 0 ? (
        <div className="border border-border p-12 text-center max-w-lg mx-auto my-12">
          <p className="text-body-sm text-muted-foreground">
            No lyrics found matching the selected letter or search criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedLetter("ALL");
              setSearch("");
            }}
            className="mt-6 inline-flex items-center gap-2 border border-border px-4 py-2 text-caption uppercase tracking-widest text-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <span>Show all songs</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {songChunks.map((chunk, chunkIdx) => (
            <SongAccordionRow
              key={`row-${chunkIdx}-${chunk[0]?.id}`}
              songs={chunk}
              startIndex={chunkIdx * ITEMS_PER_ROW}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type SongAccordionRowProps = {
  songs: Song[];
  startIndex: number;
};

const SongAccordionRow = React.memo(function SongAccordionRow({
  songs,
  startIndex,
}: SongAccordionRowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  // ── Transition lock to eliminate hover lag & jitter ──
  const lockRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, []);

  const activateCard = useCallback(
    (i: number) => {
      if (i === activeIndex) return;

      if (lockRef.current) {
        pendingRef.current = i;
        return;
      }

      lockRef.current = true;
      pendingRef.current = null;
      setActiveIndex(i);

      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(() => {
        lockRef.current = false;

        if (pendingRef.current !== null && pendingRef.current !== i) {
          const next = pendingRef.current;
          pendingRef.current = null;
          activateCard(next);
        }
      }, 420);
    },
    [activeIndex],
  );

  return (
    <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:h-[460px] lg:h-[500px] w-full overflow-hidden pb-2 [contain:layout]">
      {songs.map((song, i) => {
        const isActive = activeIndex === i;
        const indexNum = String(startIndex + i + 1).padStart(2, "0");
        const artistDisplay = song.featuring
          ? `${song.artist} ft. ${song.featuring}`
          : song.artist;

        return (
          <div
            key={song.id}
            onClick={() => {
              if (isActive) {
                router.push(`/lyrics/${song.id}?from=songs`);
              } else {
                activateCard(i);
              }
            }}
            onMouseEnter={() => activateCard(i)}
            className={`group relative overflow-hidden border bg-muted cursor-pointer transition-[flex,border-color] duration-500 ease-[0.25,1,0.35,1] [contain:layout_paint] ${
              isActive
                ? "md:flex-[0_0_460px] lg:flex-[0_0_500px] w-full aspect-square md:aspect-auto md:h-full border-accent z-10"
                : "md:flex-1 md:min-w-0 h-14 md:h-full border-border hover:border-accent/60 z-0"
            }`}
          >
            {/* Cover Image Wrapper — Full cover across dynamic inactive widths & 1:1 active width */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              {song.imageUrl ? (
                <img
                  src={song.imageUrl}
                  alt={`${song.title} — ${artistDisplay}`}
                  width={500}
                  height={500}
                  className={`size-full object-cover transition-opacity duration-500 ease-out ${
                    isActive
                      ? "opacity-95"
                      : "opacity-40 grayscale group-hover:opacity-60"
                  }`}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="size-full flex items-center justify-center bg-muted">
                  <span className="text-display font-light text-muted-foreground/20 leading-none select-none">
                    {song.title.charAt(0)}
                  </span>
                </div>
              )}

              {/* Scrim Overlay untuk kontras teks */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                  isActive
                    ? "bg-gradient-to-t from-black/90 via-black/40 to-black/20"
                    : "bg-black/60 group-hover:bg-black/40"
                }`}
              />
            </div>

            {/* === ACTIVE / EXPANDED VIEW === */}
            <div
              className={`relative z-10 size-full md:w-[460px] lg:w-[500px] flex flex-col justify-between p-5 md:p-7 transition-opacity duration-400 ease-out ${
                isActive
                  ? "opacity-100 pointer-events-auto delay-150"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Top: Nomor Indeks & Album */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption font-mono uppercase text-bone-white/80 tracking-widest select-none">
                  [{indexNum}]
                </span>
                {song.album && (
                  <span className="text-caption uppercase text-bone-white/70 tracking-widest truncate max-w-[55%] select-none">
                    {song.album}
                  </span>
                )}
              </div>

              {/* Bottom: Judul, Artis & Link Arrow */}
              <div className="flex items-end justify-between gap-4">
                <div className="max-w-md min-w-0">
                  <p className="text-caption uppercase text-accent tracking-widest font-medium line-clamp-1">
                    {artistDisplay}
                  </p>
                  <h3 className="mt-1 text-heading-sm md:text-heading font-light leading-heading-sm md:leading-heading text-bone-white tracking-[-0.02em] line-clamp-2">
                    {song.title}
                  </h3>
                </div>

                <Link
                  href={`/lyrics/${song.id}?from=songs`}
                  aria-label={`Open lyrics for ${song.title}`}
                  className="flex size-10 md:size-11 shrink-0 items-center justify-center border border-accent bg-accent text-accent-foreground hover:scale-105 active:scale-95 transition-transform"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ArrowUpRight size={16} strokeWidth={1.5} />
                </Link>
              </div>
            </div>

            {/* === COLLAPSED VIEW (DESKTOP: Vertical Text Strip) === */}
            <div
              className={`absolute inset-0 z-10 hidden md:flex flex-col justify-between items-center py-6 px-2 transition-opacity duration-300 ease-out ${
                !isActive
                  ? "opacity-100 pointer-events-auto delay-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <span className="text-caption font-mono uppercase text-bone-white/80 tracking-widest select-none">
                {indexNum}
              </span>

              <span className="text-caption uppercase tracking-widest text-bone-white/90 [writing-mode:vertical-rl] rotate-180 select-none whitespace-nowrap group-hover:text-accent transition-colors">
                {song.title} — {artistDisplay}
              </span>
            </div>

            {/* === COLLAPSED VIEW (MOBILE: Horizontal Strip Bar) === */}
            <div
              className={`absolute inset-0 z-10 flex md:hidden items-center justify-between px-4 transition-opacity duration-300 ease-out ${
                !isActive
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-caption font-mono uppercase text-accent tracking-widest font-medium shrink-0">
                  {indexNum}
                </span>
                <span className="text-caption uppercase tracking-wide text-bone-white truncate">
                  {song.title}
                </span>
              </div>
              <span className="text-caption uppercase text-bone-white/60 truncate shrink-0 ml-2">
                {artistDisplay}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});
