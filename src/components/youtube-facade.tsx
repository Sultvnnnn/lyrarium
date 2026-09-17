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

      {/* Editorial Play Trigger Button (Sharp Square, Semantic Tokens, Lucide 16/1) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex size-12 items-center justify-center border border-accent bg-background text-accent transition-transform duration-200 group-hover:scale-105 group-hover:bg-accent group-hover:text-accent-foreground">
          <Play size={16} strokeWidth={1} className="translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}
