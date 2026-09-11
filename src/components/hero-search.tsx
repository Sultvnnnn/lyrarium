"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Search, ShieldCheck, X } from "lucide-react";
import { LyricPoster, type HeroItem } from "@/components/lyric-poster";

type HeroSearchProps = {
  items: HeroItem[];
  initialQuery?: string;
  artist?: string;
};

export function HeroSearch({ items, initialQuery, artist }: HeroSearchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Bersihkan recognition saat unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Fitur Speech-to-Text (Pengenalan Suara untuk Bernyanyi / Mengucap Lirik)
  const toggleListening = () => {
    setSpeechError(null);

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Browser does not support Speech Recognition.");
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (inputRef.current) {
          inputRef.current.value = currentTranscript;
        }
        setQuery(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          setSpeechError("Audio listening failed or microphone permission denied.");
          setTimeout(() => setSpeechError(null), 4000);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechError("Unable to access microphone.");
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    setQuery("");
  };

  return (
    <section className="flex flex-col items-center justify-center pt-8 pb-10 px-4 md:px-8">
      {/* 1. Kinetic Typographic Lyric Poster (Out of the box framer-motion animation) */}
      <div className="mb-8 w-full flex justify-center">
        <LyricPoster items={items} centered={true} />
      </div>

      {/* 2. Hero Search Box Card (Compact, highlighted mic, and Search icon) */}
      <form
        action="/"
        method="get"
        className="w-full max-w-2xl"
      >
        {artist && <input type="hidden" name="artist" value={artist} />}

        <div className="relative flex items-center gap-2 border border-border bg-muted/30 py-2.5 pl-5 pr-2.5 transition-all focus-within:border-accent hover:border-accent/60">
          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            name="q"
            defaultValue={initialQuery ?? ""}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, artist, or lyrics..."
            className="w-full bg-transparent text-body font-light text-foreground placeholder:text-muted-foreground focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />

          {/* Tombol Clear jika ada teks */}
          <AnimatePresence>
            {query && (
              <motion.button
                type="button"
                onClick={handleClear}
                aria-label="Clear input"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-accent transition-colors"
              >
                <X size={14} strokeWidth={1} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Tombol Mic (Terhighlight, Sharp Square) */}
          <button
            type="button"
            onClick={toggleListening}
            aria-label={
              isListening
                ? "Stop voice search"
                : "Search with voice / sing lyrics"
            }
            title={
              isListening
                ? "Click to stop listening"
                : "Voice search: sing or speak a snippet of lyrics"
            }
            className={`relative flex size-9 shrink-0 items-center justify-center border transition-all ${
              isListening
                ? "border-accent bg-accent text-accent-foreground ring-2 ring-accent/40 animate-pulse"
                : "border-border bg-muted text-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Mic size={16} strokeWidth={1} />
            {isListening && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-accent animate-ping" />
            )}
          </button>

          {/* Tombol Submit Pencarian (Hanya muncul saat user mengetik teks, dengan animasi Framer Motion) */}
          <AnimatePresence>
            {query.trim().length > 0 && (
              <motion.button
                type="submit"
                aria-label="Search"
                initial={{ opacity: 0, scale: 0.8, x: 6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 6 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="flex size-9 shrink-0 items-center justify-center border border-foreground bg-foreground text-background hover:border-accent hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Search size={16} strokeWidth={1} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Listening / Error feedback */}
        {(isListening || speechError) && (
          <div className="mt-2.5 flex items-center justify-center px-4 text-caption uppercase">
            {isListening ? (
              <span className="flex items-center gap-2 text-accent animate-pulse font-normal">
                <span className="inline-block size-1.5 rounded-full bg-accent animate-ping" />
                Listening... Sing or speak lyrics
              </span>
            ) : (
              <span className="text-destructive font-normal tracking-wide">
                {speechError}
              </span>
            )}
          </div>
        )}

        {/* Filter status & Clear filter link */}
        {(initialQuery || artist) && (
          <div className="mt-4 flex items-center justify-between px-2 text-caption uppercase text-muted-foreground">
            <span>
              Filtering: {initialQuery && `"${initialQuery}"`} {artist && `(${artist})`}
            </span>
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-accent underline"
            >
              <X size={12} strokeWidth={1} /> Reset Filter
            </Link>
          </div>
        )}
      </form>
    </section>
  );
}
