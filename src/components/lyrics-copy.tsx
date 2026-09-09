"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function LyricsCopy({ lyrics }: { lyrics: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex cursor-pointer items-center gap-1.5 text-caption uppercase text-muted-foreground transition-colors hover:text-accent"
      title="Copy full lyrics"
    >
      {copied ? (
        <Check size={16} strokeWidth={1} className="text-accent" />
      ) : (
        <Copy size={16} strokeWidth={1} />
      )}
      <span>{copied ? "Copied" : "Copy lyrics"}</span>
    </button>
  );
}
