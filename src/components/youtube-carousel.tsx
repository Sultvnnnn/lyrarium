"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { type YouTubeVideo, extractYouTubeVideoId } from "@/lib/youtube";

type YouTubeCarouselProps = {
  videos: YouTubeVideo[];
  songTitle: string;
  artistName: string;
};

export function YouTubeCarousel({
  videos,
  songTitle,
  artistName,
}: YouTubeCarouselProps) {
  const validVideos = videos.filter((v) => extractYouTubeVideoId(v.url) !== null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

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
    <div>
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

      {/* Video Display with sliding animation */}
      <div className="relative mt-4 aspect-video w-full overflow-hidden border border-border bg-muted">
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
    </div>
  );
}
