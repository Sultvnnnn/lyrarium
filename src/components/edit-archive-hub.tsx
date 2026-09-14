"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Pencil, Music, User, ArrowUpRight } from "lucide-react";

export type HubSongItem = {
  id: number;
  title: string;
  artist: string;
  featuring: string | null;
  lyrics: string;
  imageUrl: string | null;
};

export type HubArtistItem = {
  name: string;
  slug: string;
  about?: string | null;
  imageUrl?: string | null;
  songCount: number;
};

type EditArchiveHubProps = {
  songs: HubSongItem[];
  artists: HubArtistItem[];
  initialTab?: "songs" | "artists";
};

export function EditArchiveHub({
  songs,
  artists,
  initialTab = "songs",
}: EditArchiveHubProps) {
  const [activeTab, setActiveTab] = useState<"songs" | "artists">(initialTab);
  const [search, setSearch] = useState("");

  // Filter songs
  const filteredSongs = useMemo(() => {
    if (!search.trim()) return songs;
    const q = search.toLowerCase().trim();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.featuring && s.featuring.toLowerCase().includes(q)) ||
        s.lyrics.toLowerCase().includes(q)
    );
  }, [songs, search]);

  // Filter artists
  const filteredArtists = useMemo(() => {
    if (!search.trim()) return artists;
    const q = search.toLowerCase().trim();
    return artists.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.about && a.about.toLowerCase().includes(q))
    );
  }, [artists, search]);

  return (
    <div className="flex flex-col gap-10">
      {/* 1. Switcher Tabs & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        {/* Editorial Segmented Switcher */}
        <div className="inline-flex items-stretch border border-border bg-muted/20">
          <button
            type="button"
            onClick={() => {
              setActiveTab("songs");
              setSearch("");
            }}
            className={`flex items-center gap-2.5 px-5 py-3 text-caption uppercase tracking-wider transition-colors ${
              activeTab === "songs"
                ? "bg-foreground text-background font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Music size={16} strokeWidth={1} />
            <span>
              01 // Songs & Lyrics ({songs.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("artists");
              setSearch("");
            }}
            className={`flex items-center gap-2.5 px-5 py-3 text-caption uppercase tracking-wider transition-colors border-l border-border ${
              activeTab === "artists"
                ? "bg-foreground text-background font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User size={16} strokeWidth={1} />
            <span>
              02 // Artists ({artists.length})
            </span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-80">
          <div className="flex items-center border border-border bg-transparent px-3 py-2.5 transition-colors focus-within:border-accent">
            <Search size={16} strokeWidth={1} className="text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "songs"
                  ? "Search songs, artist, lyrics..."
                  : "Search artist name or bio..."
              }
              className="w-full bg-transparent text-body-sm font-light text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="text-muted-foreground hover:text-accent transition-colors ml-1"
              >
                <X size={16} strokeWidth={1} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Content Header & Count Summary */}
      <div className="flex items-center justify-between">
        <p className="text-caption uppercase text-muted-foreground tracking-widest">
          {activeTab === "songs"
            ? `Showing ${filteredSongs.length} of ${songs.length} songs`
            : `Showing ${filteredArtists.length} of ${artists.length} artists`}
        </p>

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="flex items-center gap-1.5 text-caption uppercase text-accent hover:underline"
          >
            <X size={14} strokeWidth={1} />
            <span>Clear filter</span>
          </button>
        )}
      </div>

      {/* 3. Cards Grid: SONGS */}
      {activeTab === "songs" && (
        <>
          {filteredSongs.length === 0 ? (
            <div className="border border-border p-12 text-center max-w-md mx-auto">
              <p className="text-body-sm text-muted-foreground">
                No songs matching "{search}".
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 border border-foreground bg-foreground px-4 py-2 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
              >
                Reset search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSongs.map((song, idx) => {
                const lines = song.lyrics
                  .split("\n")
                  .filter((l) => l.trim().length > 0).length;
                const words = song.lyrics.split(/\s+/).filter(Boolean).length;
                const indexNum = String(idx + 1).padStart(2, "0");

                return (
                  <div
                    key={song.id}
                    className="group border border-border bg-background hover:border-accent transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* 1:1 Cover Artwork Box */}
                      <Link
                        href={`/lyrics/${song.id}/edit`}
                        className="relative block aspect-square w-full border-b border-border bg-muted/20 overflow-hidden"
                      >
                        {song.imageUrl ? (
                          <img
                            src={song.imageUrl}
                            alt={`${song.title} — ${song.artist}`}
                            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-end p-6 bg-muted/30">
                            <span className="text-display font-light leading-none text-foreground/80">
                              {song.title.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-background/90 px-2 py-0.5 border border-border text-[11px] font-mono text-muted-foreground">
                          {indexNum}
                        </div>
                      </Link>

                      {/* Song Details */}
                      <div className="p-5">
                        <Link
                          href={`/lyrics/${song.id}/edit`}
                          className="block"
                        >
                          <h3 className="text-heading-sm font-light tracking-[-0.02em] leading-tight text-foreground group-hover:text-accent transition-colors">
                            {song.title}
                          </h3>
                        </Link>

                        <div className="mt-2 text-caption uppercase text-muted-foreground">
                          <span>{song.artist}</span>
                          {song.featuring && (
                            <span className="text-muted-foreground/70">
                              {" "}// feat. {song.featuring}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-caption text-muted-foreground">
                          <span>{lines} lines</span>
                          <span>·</span>
                          <span>{words} words</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="p-5 pt-0">
                      <Link
                        href={`/lyrics/${song.id}/edit`}
                        className="flex items-center justify-between border border-border bg-background px-4 py-2.5 text-caption uppercase tracking-wider text-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground transition-colors active:scale-[0.99]"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Pencil size={14} strokeWidth={1} />
                          <span>Edit Details & Lirik</span>
                        </span>
                        <ArrowUpRight size={14} strokeWidth={1} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 4. Cards Grid: ARTISTS */}
      {activeTab === "artists" && (
        <>
          {filteredArtists.length === 0 ? (
            <div className="border border-border p-12 text-center max-w-md mx-auto">
              <p className="text-body-sm text-muted-foreground">
                No artists matching "{search}".
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 border border-foreground bg-foreground px-4 py-2 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
              >
                Reset search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArtists.map((artist, idx) => {
                const indexNum = String(idx + 1).padStart(2, "0");

                return (
                  <div
                    key={artist.slug}
                    className="group border border-border bg-background hover:border-accent transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* 1:1 Portrait Box */}
                      <Link
                        href={`/artist/${artist.slug}/edit`}
                        className="relative block aspect-square w-full border-b border-border bg-muted/20 overflow-hidden"
                      >
                        {artist.imageUrl ? (
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-end p-6 bg-muted/30">
                            <span className="text-display font-light leading-none text-foreground/80">
                              {artist.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-background/90 px-2 py-0.5 border border-border text-[11px] font-mono text-muted-foreground">
                          {indexNum}
                        </div>
                      </Link>

                      {/* Artist Details */}
                      <div className="p-5">
                        <Link
                          href={`/artist/${artist.slug}/edit`}
                          className="block"
                        >
                          <h3 className="text-heading-sm font-light tracking-[-0.02em] leading-tight text-foreground group-hover:text-accent transition-colors">
                            {artist.name}
                          </h3>
                        </Link>

                        <div className="mt-2 text-caption uppercase text-muted-foreground">
                          {artist.songCount} {artist.songCount === 1 ? "song" : "songs"} in archive
                        </div>

                        {artist.about && (
                          <p className="mt-3 text-body-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {artist.about}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="p-5 pt-0">
                      <Link
                        href={`/artist/${artist.slug}/edit`}
                        className="flex items-center justify-between border border-border bg-background px-4 py-2.5 text-caption uppercase tracking-wider text-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground transition-colors active:scale-[0.99]"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Pencil size={14} strokeWidth={1} />
                          <span>Edit Artist Profile</span>
                        </span>
                        <ArrowUpRight size={14} strokeWidth={1} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
