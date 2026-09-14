"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Pencil } from "lucide-react";
import { motion } from "framer-motion";

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
  const [activeSongIndex, setActiveSongIndex] = useState(0);
  const [activeArtistIndex, setActiveArtistIndex] = useState(0);
  const router = useRouter();

  // Reset active cards on search change
  useEffect(() => {
    setActiveSongIndex(0);
    setActiveArtistIndex(0);
  }, [search]);

  // Transition lock for songs
  const songLockRef = useRef(false);
  const songLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const songPendingRef = useRef<number | null>(null);

  // Transition lock for artists
  const artistLockRef = useRef(false);
  const artistLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const artistPendingRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (songLockTimerRef.current) clearTimeout(songLockTimerRef.current);
      if (artistLockTimerRef.current) clearTimeout(artistLockTimerRef.current);
    };
  }, []);

  const activateSongCard = useCallback(
    (i: number) => {
      if (i === activeSongIndex) return;

      if (songLockRef.current) {
        songPendingRef.current = i;
        return;
      }

      songLockRef.current = true;
      songPendingRef.current = null;
      setActiveSongIndex(i);

      if (songLockTimerRef.current) clearTimeout(songLockTimerRef.current);
      songLockTimerRef.current = setTimeout(() => {
        songLockRef.current = false;

        if (songPendingRef.current !== null && songPendingRef.current !== i) {
          const next = songPendingRef.current;
          songPendingRef.current = null;
          activateSongCard(next);
        }
      }, 420);
    },
    [activeSongIndex]
  );

  const activateArtistCard = useCallback(
    (i: number) => {
      if (i === activeArtistIndex) return;

      if (artistLockRef.current) {
        artistPendingRef.current = i;
        return;
      }

      artistLockRef.current = true;
      artistPendingRef.current = null;
      setActiveArtistIndex(i);

      if (artistLockTimerRef.current) clearTimeout(artistLockTimerRef.current);
      artistLockTimerRef.current = setTimeout(() => {
        artistLockRef.current = false;

        if (artistPendingRef.current !== null && artistPendingRef.current !== i) {
          const next = artistPendingRef.current;
          artistPendingRef.current = null;
          activateArtistCard(next);
        }
      }, 420);
    },
    [activeArtistIndex]
  );

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
      {/* 1. Switcher Toolbar (Simple "Songs" & "Artists", no icons, kinetic sliding indicator) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        {/* Kinetic Sliding Tab Switcher */}
        <div className="relative inline-flex items-stretch border border-border bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("songs")}
            className={`relative z-10 px-8 py-2.5 text-caption uppercase tracking-wider transition-colors ${
              activeTab === "songs"
                ? "text-background font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Songs
            {activeTab === "songs" && (
              <motion.div
                layoutId="activeEditTabPill"
                className="absolute inset-0 bg-foreground -z-10"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("artists")}
            className={`relative z-10 px-8 py-2.5 text-caption uppercase tracking-wider transition-colors ${
              activeTab === "artists"
                ? "text-background font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Artists
            {activeTab === "artists" && (
              <motion.div
                layoutId="activeEditTabPill"
                className="absolute inset-0 bg-foreground -z-10"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                }}
              />
            )}
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-80">
          <div className="flex items-center border border-border bg-transparent px-3 py-2.5 transition-colors focus-within:border-accent">
            <Search
              size={16}
              strokeWidth={1}
              className="text-muted-foreground mr-2 shrink-0"
            />
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

      {/* 2. Count Summary */}
      <div className="flex items-center justify-between">
        <span className="text-caption uppercase text-muted-foreground tracking-widest">
          {activeTab === "songs"
            ? `${filteredSongs.length} ${filteredSongs.length === 1 ? "song" : "songs"}`
            : `${filteredArtists.length} ${filteredArtists.length === 1 ? "artist" : "artists"}`}
        </span>

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

      {/* 3. PHYSICAL HORIZONTAL SLIDING TRACK (Seamless Carousel Scroll, 0% to -50%, No Opacity Fade) */}
      <div className="relative w-full overflow-hidden">
        <motion.div
          className="flex w-[200%]"
          initial={false}
          animate={{ x: activeTab === "songs" ? "0%" : "-50%" }}
          transition={{
            duration: 0.6,
            ease: [0.25, 1, 0.35, 1],
          }}
        >
          {/* TRACK 1: SONGS (100% of visible container width) */}
          <div className="w-1/2 shrink-0">
            {filteredSongs.length === 0 ? (
              <div className="border border-border p-12 text-center max-w-md mx-auto">
                <p className="text-body-sm text-muted-foreground">
                  No songs found matching "{search}".
                </p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 border border-foreground bg-foreground px-4 py-2 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:h-[460px] lg:h-[500px] w-full overflow-x-auto scrollbar-none pb-2">
                  {filteredSongs.map((song, i) => {
                    const isActive = activeSongIndex === i;
                    const indexNum = String(i + 1).padStart(2, "0");
                    const artistDisplay = song.featuring
                      ? `${song.artist} ft. ${song.featuring}`
                      : song.artist;

                    return (
                      <div
                        key={song.id}
                        onClick={() => {
                          if (isActive) {
                            router.push(`/lyrics/${song.id}/edit`);
                          } else {
                            activateSongCard(i);
                          }
                        }}
                        onMouseEnter={() => activateSongCard(i)}
                        className={`group relative overflow-hidden border bg-muted cursor-pointer transition-[flex,border-color] duration-500 ease-[0.25,1,0.35,1] ${
                          isActive
                            ? "md:flex-[0_0_460px] lg:flex-[0_0_500px] h-[360px] sm:h-[400px] md:h-full border-accent z-10"
                            : "md:flex-[0_0_72px] lg:flex-[0_0_84px] h-14 md:h-full border-border hover:border-accent/60 z-0"
                        }`}
                      >
                        {/* Cover Image Wrapper */}
                        <div className="absolute inset-0 md:inset-auto md:top-0 md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:right-auto w-full h-full md:w-[460px] lg:w-[500px] pointer-events-none">
                          {song.imageUrl ? (
                            <img
                              src={song.imageUrl}
                              alt={`${song.title} — ${artistDisplay}`}
                              className={`size-full object-cover transition-opacity duration-500 ease-out ${
                                isActive
                                  ? "opacity-95"
                                  : "opacity-40 grayscale group-hover:opacity-60 group-hover:grayscale-0"
                              }`}
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center bg-muted">
                              <span className="text-display font-light text-muted-foreground/20 leading-none select-none">
                                {song.title.charAt(0)}
                              </span>
                            </div>
                          )}

                          {/* Scrim Overlay */}
                          <div
                            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                              isActive
                                ? "bg-gradient-to-t from-black/90 via-black/40 to-black/20"
                                : "bg-black/60 group-hover:bg-black/40"
                            }`}
                          />
                        </div>

                        {/* ACTIVE / EXPANDED VIEW */}
                        <div
                          className={`relative z-10 size-full md:w-[460px] lg:w-[500px] flex flex-col justify-between p-5 md:p-7 transition-opacity duration-400 ease-out ${
                            isActive
                              ? "opacity-100 pointer-events-auto delay-150"
                              : "opacity-0 pointer-events-none"
                          }`}
                        >
                          {/* Top: Nomor Indeks & Badge */}
                          <div className="flex items-center justify-between">
                            <span className="text-caption font-mono uppercase text-bone-white/80 tracking-widest select-none">
                              [{indexNum}]
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-caption uppercase text-accent tracking-wider font-mono">
                              <Pencil size={12} strokeWidth={1} />
                              <span>Edit Song</span>
                            </span>
                          </div>

                          {/* Bottom: Judul, Artis & Action Button */}
                          <div className="flex items-end justify-between gap-4">
                            <div className="max-w-md">
                              <p className="text-caption uppercase text-accent tracking-widest font-medium">
                                {artistDisplay}
                              </p>
                              <h3 className="mt-1 text-heading-sm md:text-heading font-light leading-heading-sm md:leading-heading text-bone-white tracking-[-0.02em]">
                                {song.title}
                              </h3>
                            </div>

                            {/* Direct Link to Edit */}
                            <Link
                              href={`/lyrics/${song.id}/edit`}
                              aria-label={`Edit ${song.title}`}
                              className="flex size-10 md:size-11 shrink-0 items-center justify-center border border-accent bg-accent text-accent-foreground hover:scale-105 active:scale-95 transition-transform"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Pencil size={16} strokeWidth={1.5} />
                            </Link>
                          </div>
                        </div>

                        {/* COLLAPSED VIEW (DESKTOP: Vertical Text Strip) */}
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

                        {/* COLLAPSED VIEW (MOBILE: Horizontal Strip Bar) */}
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
              </div>
            )}
          </div>

          {/* TRACK 2: ARTISTS (100% of visible container width) */}
          <div className="w-1/2 shrink-0">
            {filteredArtists.length === 0 ? (
              <div className="border border-border p-12 text-center max-w-md mx-auto">
                <p className="text-body-sm text-muted-foreground">
                  No artists found matching "{search}".
                </p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 border border-foreground bg-foreground px-4 py-2 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:h-[460px] lg:h-[500px] w-full overflow-x-auto scrollbar-none pb-2">
                  {filteredArtists.map((artist, i) => {
                    const isActive = activeArtistIndex === i;
                    const indexNum = String(i + 1).padStart(2, "0");

                    return (
                      <div
                        key={artist.slug}
                        onClick={() => {
                          if (isActive) {
                            router.push(`/artist/${artist.slug}/edit`);
                          } else {
                            activateArtistCard(i);
                          }
                        }}
                        onMouseEnter={() => activateArtistCard(i)}
                        className={`group relative overflow-hidden border bg-muted cursor-pointer transition-[flex,border-color] duration-500 ease-[0.25,1,0.35,1] ${
                          isActive
                            ? "md:flex-[0_0_460px] lg:flex-[0_0_500px] h-[360px] sm:h-[400px] md:h-full border-accent z-10"
                            : "md:flex-[0_0_72px] lg:flex-[0_0_84px] h-14 md:h-full border-border hover:border-accent/60 z-0"
                        }`}
                      >
                        {/* Portrait Image Wrapper */}
                        <div className="absolute inset-0 md:inset-auto md:top-0 md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:right-auto w-full h-full md:w-[460px] lg:w-[500px] pointer-events-none">
                          {artist.imageUrl ? (
                            <img
                              src={artist.imageUrl}
                              alt={artist.name}
                              className={`size-full object-cover transition-opacity duration-500 ease-out ${
                                isActive
                                  ? "opacity-95"
                                  : "opacity-40 grayscale group-hover:opacity-60 group-hover:grayscale-0"
                              }`}
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center bg-muted">
                              <span className="text-display font-light text-muted-foreground/20 leading-none select-none">
                                {artist.name.charAt(0)}
                              </span>
                            </div>
                          )}

                          {/* Scrim Overlay */}
                          <div
                            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                              isActive
                                ? "bg-gradient-to-t from-black/90 via-black/40 to-black/20"
                                : "bg-black/60 group-hover:bg-black/40"
                            }`}
                          />
                        </div>

                        {/* ACTIVE / EXPANDED VIEW */}
                        <div
                          className={`relative z-10 size-full md:w-[460px] lg:w-[500px] flex flex-col justify-between p-5 md:p-7 transition-opacity duration-400 ease-out ${
                            isActive
                              ? "opacity-100 pointer-events-auto delay-150"
                              : "opacity-0 pointer-events-none"
                          }`}
                        >
                          {/* Top: Nomor Indeks & Badge */}
                          <div className="flex items-center justify-between">
                            <span className="text-caption font-mono uppercase text-bone-white/80 tracking-widest select-none">
                              [{indexNum}]
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-caption uppercase text-accent tracking-wider font-mono">
                              <Pencil size={12} strokeWidth={1} />
                              <span>Edit Artist</span>
                            </span>
                          </div>

                          {/* Bottom: Nama Artis, Jumlah Lagu & Action Button */}
                          <div className="flex items-end justify-between gap-4">
                            <div className="max-w-md">
                              <p className="text-caption uppercase text-accent tracking-widest font-medium">
                                {artist.songCount} {artist.songCount === 1 ? "song" : "songs"} in archive
                              </p>
                              <h3 className="mt-1 text-heading-sm md:text-heading font-light leading-heading-sm md:leading-heading text-bone-white tracking-[-0.02em]">
                                {artist.name}
                              </h3>
                            </div>

                            {/* Direct Link to Edit Artist */}
                            <Link
                              href={`/artist/${artist.slug}/edit`}
                              aria-label={`Edit ${artist.name}`}
                              className="flex size-10 md:size-11 shrink-0 items-center justify-center border border-accent bg-accent text-accent-foreground hover:scale-105 active:scale-95 transition-transform"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Pencil size={16} strokeWidth={1.5} />
                            </Link>
                          </div>
                        </div>

                        {/* COLLAPSED VIEW (DESKTOP: Vertical Text Strip) */}
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
                            {artist.name} — {artist.songCount} {artist.songCount === 1 ? "song" : "songs"}
                          </span>
                        </div>

                        {/* COLLAPSED VIEW (MOBILE: Horizontal Strip Bar) */}
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
                              {artist.name}
                            </span>
                          </div>
                          <span className="text-caption uppercase text-bone-white/60 truncate shrink-0 ml-2">
                            {artist.songCount} {artist.songCount === 1 ? "song" : "songs"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
