"use client";

import { useState } from "react";
import { Play } from "lucide-react";

type YouTubeFacadeProps = {
  videoId: string;
  title: string;
};

export function YouTubeFacade({ videoId, title }: YouTubeFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        title={title}
        className="mt-4 aspect-video w-full border border-border"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
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
      aria-label={`Play video: ${title}`}
      className="group relative mt-4 aspect-video w-full overflow-hidden border border-border bg-muted cursor-pointer transition-colors hover:border-accent"
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
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
  );
}
