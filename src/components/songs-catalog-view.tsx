"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Disc, Search, X } from "lucide-react";
import type { Song } from "@/db/schema";

const ALPHABET = [
  "ALL",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "#",
];

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
                  title={`${letter} (${count})`}
                >
                  <span>{letter}</span>
                  {letter !== "ALL" && hasItems && (
                    <span
                      className={`ml-1 text-[10px] ${
                        isSelected ? "text-accent-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
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

      {/* Song Cards Grid */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSongs.map((song, idx) => {
            const indexStr = String(idx + 1).padStart(2, "0");
            const artistDisplay = song.featuring
              ? `${song.artist} ft. ${song.featuring}`
              : song.artist;

            // Extract first non-bracket line for preview
            const previewLine = song.lyrics
              .split("\n")
              .map((l: string) => l.trim().replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, ""))
              .find((l: string) => l.length > 0 && !l.startsWith("[") && !l.endsWith("]"));

            return (
              <Link
                key={song.id}
                href={`/lyrics/${song.id}`}
                className="group relative flex flex-col border border-border bg-muted/10 transition-colors hover:border-accent"
              >
                {/* 1:1 Cover Art Frame */}
                <div className="relative aspect-square w-full overflow-hidden border-b border-border bg-muted">
                  {song.imageUrl ? (
                    <img
                      src={song.imageUrl}
                      alt={`${song.title} — ${artistDisplay}`}
                      className="size-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center p-8">
                      <span className="text-display font-light text-muted-foreground/30 leading-none select-none">
                        {song.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Top Index Badge */}
                  <div className="absolute top-3 left-3 bg-background/90 px-2 py-0.5 border border-border text-caption font-mono uppercase text-muted-foreground tracking-widest">
                    [{indexStr}]
                  </div>

                  {/* Hover Arrow Link */}
                  <div className="absolute bottom-3 right-3 flex size-8 items-center justify-center border border-border bg-background/95 text-foreground transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground">
                    <ArrowUpRight size={16} strokeWidth={1} />
                  </div>
                </div>

                {/* Song Meta Details */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div>
                    <p className="text-caption uppercase text-muted-foreground tracking-widest line-clamp-1 group-hover:text-accent transition-colors">
                      {artistDisplay}
                    </p>
                    <h3 className="mt-1 text-heading-sm font-light leading-snug tracking-[-0.02em] text-foreground line-clamp-2">
                      {song.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                    {song.album && (
                      <div className="flex items-center gap-1.5 text-caption uppercase text-muted-foreground/80 tracking-wider">
                        <Disc size={16} strokeWidth={1} className="shrink-0" />
                        <span className="truncate">{song.album}</span>
                      </div>
                    )}
                    {previewLine && (
                      <p className="text-caption italic text-muted-foreground line-clamp-1">
                        &ldquo;{previewLine}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
