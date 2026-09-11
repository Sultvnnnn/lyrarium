"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, User } from "lucide-react";

export type AccordionArtist = {
  name: string;
  slug: string;
  about?: string | null;
  imageUrl?: string | null;
  songCount: number;
};

type ArtistAccordionProps = {
  artists: AccordionArtist[];
};

export function ArtistAccordion({ artists }: ArtistAccordionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!artists || artists.length === 0) return null;

  return (
    <div className="w-full">
      {/* Desktop & Mobile Responsive Accordion Container for Artists */}
      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:h-[460px] lg:h-[500px]">
        {artists.map((artist, i) => {
          const isActive = activeIndex === i;
          const indexNum = String(i + 1).padStart(2, "0");
          const totalNum = String(artists.length).padStart(2, "0");

          return (
            <div
              key={artist.slug}
              onClick={() => setActiveIndex(i)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`group relative overflow-hidden border border-border bg-muted cursor-pointer transition-all duration-500 ease-[0.22,1,0.36,1] ${
                isActive
                  ? "h-[380px] md:h-full md:flex-[3.5] lg:flex-[4] border-accent"
                  : "h-14 md:h-full md:flex-1 hover:border-accent/60"
              }`}
            >
              {/* Artist Portrait Backdrop / Ambient Surface */}
              {artist.imageUrl ? (
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className={`absolute inset-0 size-full object-cover transition-all duration-700 ease-out ${
                    isActive
                      ? "scale-105 opacity-85"
                      : "opacity-35 grayscale group-hover:opacity-55 group-hover:grayscale-0"
                  }`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-card">
                  <span className="text-display font-light text-muted-foreground/20 leading-none select-none">
                    {artist.name.charAt(0)}
                  </span>
                </div>
              )}

              {/* Scrim Overlay */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  isActive
                    ? "bg-gradient-to-t from-black/95 via-black/50 to-black/30"
                    : "bg-black/65 group-hover:bg-black/45"
                }`}
              />

              {/* === ACTIVE / EXPANDED VIEW (Artist Dossier) === */}
              <div
                className={`relative z-10 size-full flex flex-col justify-between p-5 md:p-7 transition-opacity duration-300 ${
                  isActive ? "opacity-100" : "opacity-0 pointer-events-none hidden md:flex"
                }`}
              >
                {/* Top: Dossier Badge & Song Count Pill */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center border border-accent/40 bg-black/60 px-3 py-1 text-caption uppercase text-accent tracking-widest backdrop-blur-xs">
                    [{indexNum}/{totalNum}] // Artist Dossier
                  </span>

                  <span className="border border-white/20 bg-black/40 px-3 py-1 text-caption uppercase text-bone-white tracking-widest">
                    {artist.songCount} {artist.songCount === 1 ? "Track" : "Tracks"}
                  </span>
                </div>

                {/* Bottom: Artist Details & Link */}
                <div className="flex items-end justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="text-caption uppercase text-muted-foreground tracking-widest">
                      Catalog Archive
                    </p>
                    <h3 className="mt-1 text-heading-sm md:text-heading font-light leading-heading-sm md:leading-heading text-bone-white tracking-[-0.02em]">
                      {artist.name}
                    </h3>

                    {artist.about && (
                      <p className="mt-2 text-body-sm text-bone-white/70 line-clamp-2 font-light">
                        {artist.about}
                      </p>
                    )}
                  </div>

                  {/* Direct Link to Artist Page */}
                  <Link
                    href={`/artist/${artist.slug}`}
                    aria-label={`View artist profile for ${artist.name}`}
                    className="flex size-11 md:size-12 shrink-0 items-center justify-center border border-foreground bg-foreground text-background hover:border-accent hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ArrowUpRight size={18} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>

              {/* === COLLAPSED VIEW (DESKTOP: Vertical Artist Name) === */}
              <div
                className={`relative z-10 size-full hidden md:flex flex-col justify-between items-center py-6 px-2 transition-opacity duration-300 ${
                  !isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-caption font-mono uppercase text-accent tracking-widest font-medium">
                    {indexNum}
                  </span>
                  <span className="text-[10px] text-bone-white/60 tracking-wider">
                    {artist.songCount}T
                  </span>
                </div>

                <span className="text-caption uppercase tracking-widest text-bone-white/90 [writing-mode:vertical-rl] rotate-180 line-clamp-1 select-none group-hover:text-accent transition-colors">
                  {artist.name}
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
                    {artist.name}
                  </span>
                </div>
                <span className="text-caption uppercase text-bone-white/60">
                  {artist.songCount} {artist.songCount === 1 ? "track" : "tracks"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
