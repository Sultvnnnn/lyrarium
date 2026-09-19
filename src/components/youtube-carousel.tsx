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

const MIN_WIDTH = 220;
const DEFAULT_WIDTH = 260;
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

  // Video Frame Size State (default small 260px, with 640px max limit)
  const [frameWidth, setFrameWidth] = useState<number>(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);

  // Restore saved width on mount or enforce default small size
  useEffect(() => {
    try {
      // Clear legacy storage key if present
      localStorage.removeItem("lyrarium_video_width");

      const saved = localStorage.getItem("lyrarium_video_width_v2");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          setFrameWidth(parsed);
          document.documentElement.style.setProperty(
            "--sidebar-video-w",
            `${parsed}px`
          );
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default small size
    setFrameWidth(DEFAULT_WIDTH);
    document.documentElement.style.setProperty(
      "--sidebar-video-w",
      `${DEFAULT_WIDTH}px`
    );
  }, []);

  // Update CSS variable whenever frameWidth changes
  const applyWidth = useCallback((newWidth: number) => {
    const clamped = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    setFrameWidth(clamped);
    document.documentElement.style.setProperty("--sidebar-video-w", `${clamped}px`);
    try {
      localStorage.setItem("lyrarium_video_width_v2", String(clamped));
    } catch {
      // ignore
    }
  }, []);

  // Cycle through preset sizes: 260 -> 360 -> 480 -> 640 (Max) -> 260
  const cyclePreset = () => {
    let next = DEFAULT_WIDTH;
    if (frameWidth < 340) next = 360;
    else if (frameWidth < 460) next = 480;
    else if (frameWidth < 620) next = 640;
    else if (frameWidth >= 620) next = DEFAULT_WIDTH;
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
          localStorage.setItem("lyrarium_video_width_v2", String(frameWidth));
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
    <div className="w-full max-w-full" style={{ maxWidth: `${frameWidth}px` }}>
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

      {/* Video Frame Container */}
      <div className="relative mt-4 w-full">
        {/* Video Frame with Sliding Carousel */}
        <div className="relative aspect-video w-full overflow-hidden border border-border bg-muted">
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

        {/* Siku-siku Line Resize Handle (Persis di Sudut Kiri Bawah Frame) */}
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
          className="group absolute bottom-0 left-0 z-20 flex size-8 items-end justify-start p-1 text-muted-foreground hover:text-accent transition-colors cursor-nesw-resize select-none"
          style={{ transform: "translate(-30%, 30%)" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="transition-colors group-hover:text-accent"
          >
            <path
              d="M1 0V13H14"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>


      </div>
    </div>
  );
}
