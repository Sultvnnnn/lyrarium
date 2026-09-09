"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, ShieldCheck, X } from "lucide-react";
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
      setSpeechError("Browser tidak mendukung Speech Recognition.");
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
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
          setSpeechError("Gagal mendengarkan audio atau mikrofon diblokir.");
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
      setSpeechError("Tidak dapat mengakses mikrofon.");
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setQuery("");
  };

  return (
    <section className="flex flex-col items-center justify-center pt-8 pb-12 px-4 md:px-8">
      {/* 1. Kinetic Typographic Lyric Poster (Out of the box framer-motion animation) */}
      <div className="mb-10 w-full flex justify-center">
        <LyricPoster items={items} centered={true} />
      </div>

      {/* 2. Hero Search Box Card (Sesuai foto referensi) */}
      <form
        action="/"
        method="get"
        className="w-full max-w-2xl"
      >
        {artist && <input type="hidden" name="artist" value={artist} />}

        <div className="rounded-[24px] border border-border bg-muted/30 p-5 transition-all focus-within:border-accent hover:border-accent/60">
          {/* Top: Textarea Search Input */}
          <div className="relative">
            <textarea
              ref={inputRef}
              name="q"
              rows={2}
              defaultValue={initialQuery ?? ""}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, artist, or lyrics..."
              className="w-full resize-none bg-transparent pr-8 text-body font-light text-foreground placeholder:text-muted-foreground focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />

            {/* Tombol Clear jika ada teks */}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear input"
                className="absolute top-1 right-1 flex size-6 items-center justify-center text-muted-foreground hover:text-accent transition-colors"
              >
                <X size={14} strokeWidth={1} />
              </button>
            )}
          </div>

          {/* Bottom: Toolbar di dalam search box */}
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-border/50">
            {/* Sisi Kiri: Status Speech to Text / Helper text (Random Line telah dihilangkan) */}
            <div className="flex items-center gap-2 text-caption uppercase">
              {isListening ? (
                <span className="flex items-center gap-2 text-accent animate-pulse font-normal">
                  <span className="inline-block size-1.5 rounded-full bg-accent animate-ping" />
                  Mendengarkan... Silakan nyanyikan lirik
                </span>
              ) : speechError ? (
                <span className="text-destructive font-normal tracking-wide">
                  {speechError}
                </span>
              ) : (
                <span className="text-muted-foreground/60 tracking-wider font-normal">
                  // Nyanyikan atau ketik lirik
                </span>
              )}
            </div>

            {/* Sisi Kanan: Mic (Speech to Text) & Submit Arrow */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                aria-label={
                  isListening
                    ? "Hentikan pencarian suara"
                    : "Cari dengan suara / nyanyikan lirik"
                }
                title={
                  isListening
                    ? "Klik untuk berhenti mendengarkan"
                    : "Cari dengan suara: nyanyikan atau ucapkan sepenggal lirik"
                }
                className={`relative flex size-9 items-center justify-center rounded-full transition-all ${
                  isListening
                    ? "bg-accent text-accent-foreground ring-2 ring-accent/40 animate-pulse"
                    : "text-muted-foreground hover:text-accent"
                }`}
              >
                <Mic size={16} strokeWidth={1} />
                {isListening && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-accent animate-ping" />
                )}
              </button>

              <button
                type="submit"
                aria-label="Search"
                className="flex size-9 items-center justify-center rounded-full bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ArrowUp size={16} strokeWidth={1} />
              </button>
            </div>
          </div>
        </div>

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

        {/* Bottom subtle status badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-caption uppercase text-muted-foreground">
          <ShieldCheck size={14} strokeWidth={1} />
          <span>Archive // Open & Preserved</span>
        </div>
      </form>
    </section>
  );
}
