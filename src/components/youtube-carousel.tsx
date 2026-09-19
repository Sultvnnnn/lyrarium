"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { type YouTubeVideo, extractYouTubeVideoId } from "@/lib/youtube";

type YouTubeCarouselProps = {
  videos: YouTubeVideo[];
  songTitle: string;
  artistName: string;
};

const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 360;
const MAX_WIDTH = 640;

export function YouTubeCarousel({
  videos,
  songTitle,
  artistName,
}: YouTubeCarouselProps) {
  const validVideos = videos.filter((v) => extractYouTubeVideoId(v.url) !== null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Video Frame Size State (with 640px max limit)
  const [frameWidth, setFrameWidth] = useState<number>(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);

  // Restore saved width on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lyrarium_video_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          setFrameWidth(parsed);
          document.documentElement.style.setProperty(
            "--sidebar-video-w",
            `${parsed}px`
          );
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Update CSS variable whenever frameWidth changes
  const applyWidth = useCallback((newWidth: number) => {
    const clamped = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    setFrameWidth(clamped);
    document.documentElement.style.setProperty("--sidebar-video-w", `${clamped}px`);
    try {
      localStorage.setItem("lyrarium_video_width", String(clamped));
    } catch {
      // ignore
    }
  }, []);

  // Cycle through preset sizes: 360 -> 480 -> 640 (Max) -> 280 (Min) -> 360
  const cyclePreset = () => {
    let next = DEFAULT_WIDTH;
    if (frameWidth < 360) next = 360;
    else if (frameWidth < 480) next = 480;
    else if (frameWidth < 640) next = 640;
    else if (frameWidth >= 640) next = 280;
    applyWidth(next);
  };

  const resetToDefault = () => {
    applyWidth(DEFAULT_WIDTH);
  };

  // Pointer drag handling for bottom-left siku-siku resize handle
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = frameWidth;
    let hasMoved = false;

    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = startX - moveEvent.clientX; // moving left increases width
      const deltaY = moveEvent.clientY - startY; // moving down increases width in 16:9

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMoved = true;
      }

      // Responsive calculation: moving left or downwards scales the frame outwards
      const delta =
        Math.abs(deltaX) >= Math.abs(deltaY * (16 / 9))
          ? deltaX
          : deltaY * (16 / 9);

      const calculatedW = startW + delta;

      const maxSafe =
        typeof window !== "undefined"
          ? Math.min(MAX_WIDTH, Math.max(460, window.innerWidth - 400))
          : MAX_WIDTH;

      const clamped = Math.round(Math.min(maxSafe, Math.max(MIN_WIDTH, calculatedW)));
      setFrameWidth(clamped);
      document.documentElement.style.setProperty("--sidebar-video-w", `${clamped}px`);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      setIsDragging(false);

      if (!hasMoved) {
        // Click without drag -> cycle preset sizes
        cyclePreset();
      } else {
        try {
          localStorage.setItem("lyrarium_video_width", String(frameWidth));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  if (validVideos.length === 0) return null;

  // Ensure index is within bounds if videos array changes
  const activeIndex = currentIndex >= validVideos.length ? 0 : currentIndex;
  const currentVideo = validVideos[activeIndex];
  const videoId = extractYouTubeVideoId(currentVideo.url);

  const handlePrev = () => {
    setDirection(-1);
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? validVideos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev === validVideos.length - 1 ? 0 : prev + 1));
  };

  const currentDisplayTitle =
    currentVideo.title || (activeIndex === 0 ? "Music Video" : `Video ${activeIndex + 1}`);

  return (
    <div className="w-full">
      {/* Header bar: Title + Index Counter + Arrow Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <p className="truncate text-caption uppercase text-muted-foreground">
            {currentDisplayTitle}
          </p>
          {validVideos.length > 1 && (
            <span className="text-[11px] font-mono text-muted-foreground/70 shrink-0">
              [{activeIndex + 1}/{validVideos.length}]
            </span>
          )}
        </div>

        {validVideos.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous video"
              className="flex size-7 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:border-accent hover:text-accent active:scale-95"
            >
              <ChevronLeft size={16} strokeWidth={1} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next video"
              className="flex size-7 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:border-accent hover:text-accent active:scale-95"
            >
              <ChevronRight size={16} strokeWidth={1} />
            </button>
          </div>
        )}
      </div>

      {/* Video Frame with Sliding Carousel */}
      <div className="relative mt-4 aspect-video w-full overflow-hidden border border-border bg-muted">
        {/* Global drag shield to prevent iframe event interception while dragging */}
        {isDragging && (
          <div className="fixed inset-0 z-50 cursor-nesw-resize select-none bg-transparent" />
        )}

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`${activeIndex}-${videoId}`}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                x: dir > 0 ? "100%" : "-100%",
                opacity: 0,
              }),
              center: {
                x: 0,
                opacity: 1,
              },
              exit: (dir: number) => ({
                x: dir > 0 ? "-100%" : "100%",
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="size-full"
          >
            {isPlaying && videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={`${songTitle} — ${currentDisplayTitle}`}
                className="size-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : videoId ? (
              <div
                onClick={() => setIsPlaying(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsPlaying(true);
                  }
                }}
                aria-label={`Play video: ${currentDisplayTitle}`}
                className="group relative size-full cursor-pointer transition-colors"
              >
                <img
                  src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                  alt={`${songTitle} — ${currentDisplayTitle}`}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-95"
                />

                {/* Dim scrim for contrast */}
                <div className="absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/45 pointer-events-none" />

                {/* Editorial Play Trigger Button (Sharp, Balanced, Semantic Tokens) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2.5 border border-border bg-background px-4 py-2.5 text-caption uppercase tracking-widest text-foreground transition-all duration-200 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground active:scale-95">
                    <Play size={16} strokeWidth={1} />
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Outside Frame Bottom Area: Single Siku-siku Handle on Bottom-Left & Limit Indicator */}
      <div className="mt-2 flex items-center justify-between min-h-[16px]">
        {/* Siku-siku Line Resize Handle (Bottom-Left) */}
        <button
          type="button"
          onPointerDown={startDrag}
          onDoubleClick={resetToDefault}
          title={
            frameWidth >= MAX_WIDTH
              ? "Max limit reached (640px) // Click to cycle or drag to resize"
              : "Drag or click to resize video frame (Max 640px)"
          }
          aria-label="Resize video frame"
          className="group flex size-5 items-center justify-center text-muted-foreground transition-colors hover:text-accent cursor-nesw-resize select-none"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-colors group-hover:text-accent"
          >
            <path
              d="M1 1V13H13"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="square"
            />
          </svg>
        </button>

        {/* Limit indicator: only shown when size reaches max limit */}
        {frameWidth >= MAX_WIDTH && (
          <span className="text-caption uppercase text-accent font-normal select-none tracking-widest">
            Limit
          </span>
        )}
      </div>
    </div>
  );
}
