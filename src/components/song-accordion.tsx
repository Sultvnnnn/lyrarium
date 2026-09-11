"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export type AccordionSong = {
  id: number;
  title: string;
  artist: string;
  lyrics: string;
  imageUrl: string | null;
  createdAt?: Date | null;
};

type SongAccordionProps = {
  songs: AccordionSong[];
};

export function SongAccordion({ songs }: SongAccordionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!songs || songs.length === 0) return null;

  return (
    <div className="w-full">
      {/* Desktop & Mobile Responsive Accordion Container */}
      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:h-[480px] lg:h-[520px]">
        {songs.map((song, i) => {
          const isActive = activeIndex === i;
          const indexNum = String(i + 1).padStart(2, "0");
          const totalNum = String(songs.length).padStart(2, "0");

          // Extract first 2 lines of lyrics for snippet teaser
          const lyricSnippet = song.lyrics
            ? song.lyrics
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean)
                .slice(0, 2)
                .join(" / ")
            : "";

          return (
            <div
              key={song.id}
              onClick={() => setActiveIndex(i)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`group relative overflow-hidden border border-border bg-muted cursor-pointer transition-all duration-500 ease-[0.22,1,0.36,1] ${
                isActive
                  ? "h-[360px] md:h-full md:flex-[3.5] lg:flex-[4] border-accent"
                  : "h-14 md:h-full md:flex-1 hover:border-accent/60"
              }`}
            >
              {/* Background Cover Image / Fallback */}
              {song.imageUrl ? (
                <img
                  src={song.imageUrl}
                  alt={`${song.title} — ${song.artist}`}
                  className={`absolute inset-0 size-full object-cover transition-all duration-700 ease-out ${
                    isActive
                      ? "scale-105 opacity-90"
                      : "opacity-40 grayscale group-hover:opacity-60 group-hover:grayscale-0"
                  }`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <span className="text-display font-light text-muted-foreground/20 leading-none select-none">
                    {song.title.charAt(0)}
                  </span>
                </div>
              )}

              {/* Scrim Overlay for contrast */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  isActive
                    ? "bg-gradient-to-t from-black/90 via-black/40 to-black/30"
                    : "bg-black/60 group-hover:bg-black/40"
                }`}
              />

              {/* === ACTIVE / EXPANDED VIEW === */}
              <div
                className={`relative z-10 size-full flex flex-col justify-between p-5 md:p-7 transition-opacity duration-300 ${
                  isActive ? "opacity-100" : "opacity-0 pointer-events-none hidden md:flex"
                }`}
              >
                {/* Top: Index & Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center border border-white/20 bg-black/50 px-3 py-1 text-caption uppercase text-bone-white tracking-widest backdrop-blur-xs">
                    [{indexNum}/{totalNum}] // Recent Song
                  </span>

                  <span className="text-caption uppercase text-bone-white/70 tracking-widest">
                    Archive #{song.id}
                  </span>
                </div>

                {/* Bottom: Title, Artist, Excerpt & Link */}
                <div className="flex items-end justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="text-caption uppercase text-accent tracking-widest font-medium">
                      {song.artist}
                    </p>
                    <h3 className="mt-1 text-heading-sm md:text-heading font-light leading-heading-sm md:leading-heading text-bone-white tracking-[-0.02em]">
                      {song.title}
                    </h3>
                    {lyricSnippet && (
                      <p className="mt-2 text-body-sm text-bone-white/70 line-clamp-2 font-light">
                        “{lyricSnippet}”
                      </p>
                    )}
                  </div>

                  {/* Direct Link to Song lyrics */}
                  <Link
                    href={`/lyrics/${song.id}`}
                    aria-label={`Open lyrics for ${song.title}`}
                    className="flex size-11 md:size-12 shrink-0 items-center justify-center border border-accent bg-accent text-accent-foreground hover:scale-105 active:scale-95 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ArrowUpRight size={18} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>

              {/* === COLLAPSED VIEW (DESKTOP: Vertical Text Strip) === */}
              <div
                className={`relative z-10 size-full hidden md:flex flex-col justify-between items-center py-6 px-2 transition-opacity duration-300 ${
                  !isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <span className="text-caption font-mono uppercase text-bone-white/80 tracking-widest">
                  {indexNum}
                </span>

                <span className="text-caption uppercase tracking-widest text-bone-white/90 [writing-mode:vertical-rl] rotate-180 line-clamp-1 select-none group-hover:text-accent transition-colors">
                  {song.title} — {song.artist}
                </span>
              </div>

              {/* === COLLAPSED VIEW (MOBILE: Horizontal Strip Bar) === */}
              <div
                className={`relative z-10 size-full flex md:hidden items-center justify-between px-4 transition-opacity duration-300 ${
                  !isActive ? "opacity-100" : "opacity-0 pointer-events-none hidden"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-caption font-mono uppercase text-accent tracking-widest font-medium">
                    {indexNum}
                  </span>
                  <span className="text-caption uppercase tracking-wide text-bone-white line-clamp-1">
                    {song.title}
                  </span>
                </div>
                <span className="text-caption uppercase text-bone-white/60 line-clamp-1">
                  {song.artist}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
