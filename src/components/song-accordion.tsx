"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  if (!songs || songs.length === 0) return null;

  return (
    <div className="w-full">
      {/* 
        Accordion Container:
        - Desktop: Menyamping (flex-row), height 460px (500px di lg).
        - Mobile: Menurun (flex-col).
        - Active card: strictly 1:1 square (width = height), menjaga gambar tetap persegi utuh tanpa melar/melebar.
        - Inactive cards: strip ramping berorientasi tetap (flex-none) sehingga transisi antar kartu berjalan sangat mulus (60/120fps).
      */}
      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:h-[460px] lg:h-[500px] w-full overflow-x-auto scrollbar-none pb-2">
        {songs.map((song, i) => {
          const isActive = activeIndex === i;
          const indexNum = String(i + 1).padStart(2, "0");

          return (
            <div
              key={song.id}
              onClick={() => {
                if (isActive) {
                  router.push(`/lyrics/${song.id}`);
                } else {
                  setActiveIndex(i);
                }
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`group relative overflow-hidden border bg-muted cursor-pointer will-change-[width,height] transition-[width,height,border-color,background-color] duration-700 ease-[0.16,1,0.3,1] ${
                isActive
                  ? "w-full max-w-[420px] aspect-square mx-auto md:mx-0 md:w-[460px] lg:w-[500px] md:h-full md:aspect-square flex-none border-accent z-10"
                  : "w-full h-14 md:h-full md:w-[72px] lg:w-[84px] flex-none border-border hover:border-accent/60 z-0"
              }`}
            >
              {/* Background Cover Image (1:1 Album Art) dengan transisi mulus dan transform-gpu */}
              {song.imageUrl ? (
                <img
                  src={song.imageUrl}
                  alt={`${song.title} — ${song.artist}`}
                  className={`absolute inset-0 size-full object-cover transform-gpu transition-all duration-700 ease-[0.16,1,0.3,1] ${
                    isActive
                      ? "opacity-95 scale-100"
                      : "opacity-40 grayscale group-hover:opacity-60 group-hover:grayscale-0 scale-105"
                  }`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <span className="text-display font-light text-muted-foreground/20 leading-none select-none">
                    {song.title.charAt(0)}
                  </span>
                </div>
              )}

              {/* Scrim Overlay untuk kontras teks di atas foto */}
              <div
                className={`absolute inset-0 transition-opacity duration-700 ease-[0.16,1,0.3,1] ${
                  isActive
                    ? "bg-gradient-to-t from-black/90 via-black/40 to-black/20"
                    : "bg-black/60 group-hover:bg-black/40"
                }`}
              />

              {/* === ACTIVE / EXPANDED VIEW (Strictly 1:1 Square, Bersih & Mulus) === */}
              <div
                className={`relative z-10 size-full flex flex-col justify-between p-5 md:p-7 transition-all duration-500 ease-[0.16,1,0.3,1] ${
                  isActive
                    ? "opacity-100 translate-y-0 pointer-events-auto delay-150"
                    : "opacity-0 translate-y-2 pointer-events-none hidden md:flex"
                }`}
              >
                {/* Top: Hanya Nomor Indeks */}
                <div className="flex items-center justify-between">
                  <span className="text-caption font-mono uppercase text-bone-white/80 tracking-widest">
                    [{indexNum}]
                  </span>
                </div>

                {/* Bottom: Judul, Artis & Link Arrow */}
                <div className="flex items-end justify-between gap-4">
                  <div className="max-w-md">
                    <p className="text-caption uppercase text-accent tracking-widest font-medium">
                      {song.artist}
                    </p>
                    <h3 className="mt-1 text-heading-sm md:text-heading font-light leading-heading-sm md:leading-heading text-bone-white tracking-[-0.02em]">
                      {song.title}
                    </h3>
                  </div>

                  {/* Direct Link to Song lyrics */}
                  <Link
                    href={`/lyrics/${song.id}`}
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
                className={`relative z-10 size-full hidden md:flex flex-col justify-between items-center py-6 px-2 transition-opacity duration-300 ease-out ${
                  !isActive
                    ? "opacity-100 pointer-events-auto delay-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <span className="text-caption font-mono uppercase text-bone-white/80 tracking-widest">
                  {indexNum}
                </span>

                <span className="text-caption uppercase tracking-widest text-bone-white/90 [writing-mode:vertical-rl] rotate-180 select-none whitespace-nowrap group-hover:text-accent transition-colors">
                  {song.title} — {song.artist}
                </span>
              </div>

              {/* === COLLAPSED VIEW (MOBILE: Horizontal Strip Bar) === */}
              <div
                className={`relative z-10 size-full flex md:hidden items-center justify-between px-4 transition-opacity duration-300 ease-out ${
                  !isActive
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none hidden"
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
