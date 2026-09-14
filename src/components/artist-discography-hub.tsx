"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { SongAccordion, type AccordionSong } from "@/components/song-accordion";

export type ArtistSongItem = AccordionSong & {
  album?: string | null;
};

type TabItem = {
  id: string;
  label: string;
  albumName?: string;
  artworkUrl?: string | null;
  songs: ArtistSongItem[];
};

type ArtistDiscographyHubProps = {
  songs: ArtistSongItem[];
  artistName: string;
};

export function ArtistDiscographyHub({
  songs,
  artistName,
}: ArtistDiscographyHubProps) {
  const [activeTabId, setActiveTabId] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Build tabs dynamically: "All", each unique Album, and "Singles" (if mixed)
  const tabs = useMemo<TabItem[]>(() => {
    const result: TabItem[] = [];

    // Tab 1: All songs
    result.push({
      id: "all",
      label: "All",
      songs: songs,
    });

    const albumMap = new Map<
      string,
      { songs: ArtistSongItem[]; artworkUrl: string | null }
    >();
    const singles: ArtistSongItem[] = [];

    songs.forEach((s) => {
      const alb = s.album?.trim();
      if (alb) {
        if (!albumMap.has(alb)) {
          albumMap.set(alb, {
            songs: [],
            artworkUrl: s.imageUrl || null,
          });
        }
        const entry = albumMap.get(alb)!;
        entry.songs.push(s);
        if (!entry.artworkUrl && s.imageUrl) {
          entry.artworkUrl = s.imageUrl;
        }
      } else {
        singles.push(s);
      }
    });

    // Add each album tab
    for (const [albName, { songs: albSongs, artworkUrl }] of albumMap.entries()) {
      result.push({
        id: `album-${albName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        label: albName,
        albumName: albName,
        artworkUrl,
        songs: albSongs,
      });
    }

    // Add "Singles" tab if there are albums AND non-album songs
    if (albumMap.size > 0 && singles.length > 0) {
      result.push({
        id: "singles",
        label: "Singles",
        songs: singles,
      });
    }

    return result;
  }, [songs]);

  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => t.id === activeTabId);
    return idx >= 0 ? idx : 0;
  }, [tabs, activeTabId]);

  if (!songs || songs.length === 0) return null;

  return (
    <div className="flex flex-col gap-10">
      {/* 1. Switcher Toolbar (Kinetic Tab Switcher & Search) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        {/* Kinetic Sliding Tab Switcher */}
        <div className="relative inline-flex items-stretch border border-border bg-muted/20 p-1 max-w-full overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.id === tabs[activeIndex]?.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`relative z-10 px-6 sm:px-8 py-2.5 text-caption uppercase tracking-wider transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-background font-normal"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeArtistAlbumTabPill"
                    className="absolute inset-0 bg-foreground -z-10"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 32,
                    }}
                  />
                )}
              </button>
            );
          })}
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
              placeholder={`Search ${tabs[activeIndex]?.label || "songs"}...`}
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
          {tabs[activeIndex]?.songs.length}{" "}
          {tabs[activeIndex]?.songs.length === 1 ? "track" : "tracks"}
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

      {/* 3. PHYSICAL HORIZONTAL SLIDING TRACK (Seamless Carousel Scroll) */}
      <div className="relative w-full overflow-hidden">
        <motion.div
          className="flex"
          style={{ width: `${tabs.length * 100}%` }}
          initial={false}
          animate={{ x: `-${(activeIndex / tabs.length) * 100}%` }}
          transition={{
            duration: 0.6,
            ease: [0.25, 1, 0.35, 1],
          }}
        >
          {tabs.map((tab) => {
            const filteredSongs = search.trim()
              ? tab.songs.filter(
                  (s) =>
                    s.title.toLowerCase().includes(search.toLowerCase().trim()) ||
                    s.lyrics.toLowerCase().includes(search.toLowerCase().trim()) ||
                    (s.featuring &&
                      s.featuring.toLowerCase().includes(search.toLowerCase().trim()))
                )
              : tab.songs;

            return (
              <div
                key={tab.id}
                style={{ width: `${100 / tabs.length}%` }}
                className="shrink-0"
              >
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
                  <SongAccordion
                    key={tab.id}
                    songs={filteredSongs}
                    fromArtist
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
