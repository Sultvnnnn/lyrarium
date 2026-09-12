"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        docHeight > 0
          ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100))
          : 0;

      setProgress(pct);
      setVisible(scrollTop > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      className={`group fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex size-10 sm:size-11 items-center justify-center border border-border bg-background text-foreground transition-all duration-300 ease-out hover:border-accent hover:text-accent active:scale-95 overflow-hidden ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ArrowUp
        size={16}
        strokeWidth={1}
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
      />

      {/* Animated Hairline Progress Bar */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-[2px] bg-accent transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </button>
  );
}
