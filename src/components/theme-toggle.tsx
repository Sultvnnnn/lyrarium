"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

export function ThemeToggle({ inverted = false }: { inverted?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [locked, setLocked] = useState(false);
  const animRef = useRef<Animation | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex size-8 items-center justify-center border border-border">
        <Sun size={16} strokeWidth={1} />
      </div>
    );
  }

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Spam guard: kalau lagi locked, abaikan
    if (locked) return;
    setLocked(true);

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    // Cancel animasi sebelumnya (kalau ada) — ini yang mencegah kedipan
    if (animRef.current) {
      animRef.current.cancel();
      animRef.current = null;
    }

    const apply = () => setTheme(theme === "light" ? "dark" : "light");
    const doc = document as ViewTransitionDoc;

    if (!doc.startViewTransition) {
      apply();
      setTimeout(() => setLocked(false), 600);
      return;
    }

    const transition = doc.startViewTransition(apply);

    transition.ready.then(() => {
      animRef.current = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );

      // Unlock setelah animasi selesai (baik finish atau cancel)
      animRef.current.finished
        .then(() => {
          animRef.current = null;
          setLocked(false);
        })
        .catch(() => {
          // Animasi di-cancel — unlock juga
          animRef.current = null;
          setLocked(false);
        });
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={locked}
      className={`flex size-8 items-center justify-center border transition-colors ${
        inverted
          ? "border-bone-white text-bone-white dark:border-navy-ink dark:text-navy-ink"
          : "border-border text-foreground hover:border-accent hover:text-accent"
      } ${locked ? "pointer-events-none opacity-50" : ""}`}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon size={16} strokeWidth={1} />
      ) : (
        <Sun size={16} strokeWidth={1} />
      )}
    </button>
  );
}
