"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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

  // ── Transition lock ──
  // Saat card berganti, boundary semua card bergeser selama transisi CSS berlangsung.
  // Jika kursor diam di tempat, batas yang bergeser bisa memicu mouseenter
  // pada card tetangga → menyebabkan bolak-balik tak terhingga (glitch).
  // Lock mencegah pergantian card selama transisi berjalan.
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

      // Jika sedang dalam masa lock, simpan sebagai pending (akan dieksekusi setelah lock selesai)
      if (lockRef.current) {
        pendingRef.current = i;
        return;
      }

      // Set active dan lock transisi
      lockRef.current = true;
      pendingRef.current = null;
      setActiveIndex(i);

      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(() => {
        lockRef.current = false;

        // Jika ada pending hover yang masuk selama lock, eksekusi sekarang
        if (pendingRef.current !== null && pendingRef.current !== i) {
          const next = pendingRef.current;
          pendingRef.current = null;
          activateCard(next);
        }
      }, 420);
    },
    [activeIndex],
  );

  if (!songs || songs.length === 0) return null;

  return (
    <div className="w-full">
      {/* 
        Accordion Container:
        - Desktop: Menyamping (flex-row), height 460px (500px di lg).
        - Mobile: Menurun (flex-col).
        - Active card: strictly 1:1 square (width = height via explicit w matching h).
        - Inactive cards: strip ramping fixed-width (flex-none).
        - Transition lock mencegah glitch akibat boundary shift selama animasi.
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
                  activateCard(i);
                }
              }}
              onMouseEnter={() => activateCard(i)}
              className={`group relative overflow-hidden border bg-muted cursor-pointer transition-[flex,border-color] duration-500 ease-[0.25,1,0.35,1] ${
                isActive
                  ? "md:flex-[0_0_460px] lg:flex-[0_0_500px] h-[360px] sm:h-[400px] md:h-full border-accent z-10"
                  : "md:flex-[0_0_72px] lg:flex-[0_0_84px] h-14 md:h-full border-border hover:border-accent/60 z-0"
              }`}
            >
              {/* 
                Cover Image Wrapper:
                Di desktop, diposisikan di tengah (md:left-1/2 md:-translate-x-1/2) dengan lebar 1:1
                sehingga saat card dalam keadaan tertutup (close hover), bagian tengah gambarlah yang tampil.
              */}
              <div className="absolute inset-0 md:inset-auto md:top-0 md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:right-auto w-full h-full md:w-[460px] lg:w-[500px] pointer-events-none">
                {song.imageUrl ? (
                  <img
                    src={song.imageUrl}
                    alt={`${song.title} — ${song.artist}`}
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
                {/* Top: Nomor Indeks */}
                <div className="flex items-center justify-between">
                  <span className="text-caption font-mono uppercase text-bone-white/80 tracking-widest select-none">
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
                  {song.title} — {song.artist}
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
