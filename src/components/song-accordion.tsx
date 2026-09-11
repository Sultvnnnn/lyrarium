"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!songs || songs.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Horizontal Scroll Controls */}
      {songs.length > 2 && (
        <div className="hidden md:flex items-center justify-end gap-2 mb-3">
          <span className="text-caption font-mono uppercase text-muted-foreground mr-1 tracking-widest">
            {String(activeIndex + 1).padStart(2, "0")} / {String(songs.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll previous songs"
            className="flex size-7 items-center justify-center border border-border bg-background text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={1} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll next songs"
            className="flex size-7 items-center justify-center border border-border bg-background text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <ChevronRight size={14} strokeWidth={1} />
          </button>
        </div>
      )}

      {/* 
        Responsive Strip:
        - Desktop: Menyamping (flex-row), sejajar di baseline bawah (items-end).
        - Mobile: Menurun (flex-col), terpusat rapi.
        - Setiap kartu berukuran strictly 1:1 square baik saat membesar maupun mengecil.
      */}
      <div
        ref={scrollRef}
        className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-5 overflow-x-auto pb-4 pt-2 scrollbar-none min-h-[320px] md:min-h-[410px]"
      >
        {songs.map((song, i) => {
          const isActive = activeIndex === i;
          const indexNum = String(i + 1).padStart(2, "0");

          return (
            <Link
              href={`/lyrics/${song.id}`}
              key={song.id}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={(e) => {
                // Di layar sentuh mobile, tap pertama mengaktifkan kartu 1:1, tap kedua membuka detail lagu
                if (!isActive && typeof window !== "undefined" && window.innerWidth < 768) {
                  e.preventDefault();
                  setActiveIndex(i);
                }
              }}
              className={`group relative shrink-0 aspect-square overflow-hidden border bg-muted transition-all duration-500 ease-[0.22,1,0.36,1] cursor-pointer ${
                isActive
                  ? "w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[350px] md:h-[350px] lg:w-[390px] lg:h-[390px] border-accent z-10"
                  : "w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] md:w-[195px] md:h-[195px] lg:w-[215px] lg:h-[215px] border-border hover:border-accent/60 z-0"
              }`}
            >
              {/* Nomor indeks minimal di pojok kiri atas */}
              <div className="absolute top-2.5 left-2.5 z-10 border border-border bg-background/95 px-2 py-0.5 text-caption font-mono uppercase text-foreground select-none">
                {indexNum}
              </div>

              {/* Cover Image 1:1 Persegi Tajam atau Fallback */}
              {song.imageUrl ? (
                <img
                  src={song.imageUrl}
                  alt={`${song.title} — ${song.artist}`}
                  className={`size-full object-cover transition-opacity duration-500 ${
                    isActive ? "opacity-100" : "opacity-60 group-hover:opacity-85"
                  }`}
                />
              ) : (
                <div className="size-full flex items-center justify-center bg-muted">
                  <span className="text-display font-light text-muted-foreground/30 select-none">
                    {song.title.charAt(0)}
                  </span>
                </div>
              )}

              {/* 
                Solid Semantic Caption Bar di bagian bawah kartu:
                Hanya Judul & Nama Artis — tanpa teks berlebih, tanpa badge blur, tanpa snippet panjang.
              */}
              <div className="absolute bottom-0 inset-x-0 z-10 border-t border-border bg-background/95 p-3 sm:p-3.5 transition-colors group-hover:border-accent">
                <h3
                  className={`font-light text-foreground group-hover:text-accent transition-colors truncate ${
                    isActive ? "text-subheading" : "text-body-sm"
                  }`}
                >
                  {song.title}
                </h3>
                <p className="text-caption uppercase text-muted-foreground tracking-widest truncate mt-0.5">
                  {song.artist}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
