"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Mic, Search, X } from "lucide-react";
import { LyricPoster, type HeroItem } from "@/components/lyric-poster";
import type { Song } from "@/db/schema";
import type { AccordionArtist } from "@/components/artist-accordion";

type HeroSearchProps = {
  items: HeroItem[];
  initialQuery?: string;
  artist?: string;
  searchableSongs?: Song[];
  searchableArtists?: AccordionArtist[];
};

// Helper: ambil baris lirik yang cocok pertama kali
function getMatchingLyricLine(lyrics: string, query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return null;

  const lines = lyrics.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "");
    if (line.length > 0 && !line.startsWith("[") && line.toLowerCase().includes(q)) {
      return line;
    }
  }
  return null;
}

export function HeroSearch({
  items,
  initialQuery,
  artist,
  searchableSongs = [],
  searchableArtists = [],
}: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isMac, setIsMac] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Deteksi Mac OS untuk label shortcut (⌘ K vs Ctrl K)
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  // Bersihkan recognition saat unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Global Keyboard shortcuts:
  // 1. "/" atau "Ctrl+K" / "Cmd+K" untuk memfokuskan search bar
  // 2. "ESC" untuk keluar/unfocus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ESC: tutup dan blur
      if (e.key === "Escape" && isFocused) {
        setIsFocused(false);
        inputRef.current?.blur();
        return;
      }

      const activeEl = document.activeElement;
      const isInputActive =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable;

      // "/" untuk membuka search (hanya jika cursor tidak sedang aktif di dalam form/input lain)
      if (e.key === "/" && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
        return;
      }

      // "Ctrl+K" atau "Cmd+K" untuk membuka search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        isFocused
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFocused]);

  // Speech-to-Text
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
      setSpeechError("Browser does not support speech recognition.");
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
        setIsFocused(true);
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
          setSpeechError("Microphone permission denied.");
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
    setSelectedIndex(-1);
  };

  // ── Realtime search calculation ──
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { songs: [], artists: [], total: 0 };
    }

    // 1. Filter songs
    const matchingSongs: Array<Song & { matchedLyric?: string | null }> = [];
    for (const song of searchableSongs) {
      const matchTitle = song.title.toLowerCase().includes(q);
      const matchArtist = song.artist.toLowerCase().includes(q);
      const matchFeat = song.featuring?.toLowerCase().includes(q) ?? false;
      const matchAlbum = song.album?.toLowerCase().includes(q) ?? false;
      const matchedLyric = getMatchingLyricLine(song.lyrics, q);

      if (matchTitle || matchArtist || matchFeat || matchAlbum || matchedLyric) {
        matchingSongs.push({
          ...song,
          matchedLyric,
        });
      }

      if (matchingSongs.length >= 5) break;
    }

    // 2. Filter artists
    const matchingArtists = searchableArtists
      .filter((a) => a.name.toLowerCase().includes(q) || (a.about?.toLowerCase().includes(q) ?? false))
      .slice(0, 3);

    return {
      songs: matchingSongs,
      artists: matchingArtists,
      total: matchingSongs.length + matchingArtists.length,
    };
  }, [query, searchableSongs, searchableArtists]);

  // Flat list untuk keyboard navigation (ArrowUp, ArrowDown, Enter)
  const flatResults = useMemo(() => {
    const list: Array<{ id: string; url: string; title: string; type: "song" | "artist" }> = [];
    for (const s of searchResults.songs) {
      list.push({ id: `song-${s.id}`, url: `/lyrics/${s.id}`, title: s.title, type: "song" });
    }
    for (const a of searchResults.artists) {
      list.push({ id: `artist-${a.slug}`, url: `/artist/${a.slug}`, title: a.name, type: "artist" });
    }
    return list;
  }, [searchResults]);

  // Reset selectedIndex saat query berubah
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const showDropdown = isFocused && hasQuery;

  // Keyboard navigation handler untuk input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (flatResults.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === "ArrowUp") {
      if (flatResults.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
      }
      return;
    }

    if (e.key === "Enter") {
      if (selectedIndex >= 0 && flatResults[selectedIndex]) {
        e.preventDefault();
        router.push(flatResults[selectedIndex].url);
        setIsFocused(false);
      } else {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  return (
    <section className="flex flex-col items-center justify-center pt-8 pb-10 px-4 md:px-8">
      {/* 1. Kinetic Typographic Lyric Poster */}
      <div
        className={`mb-8 w-full flex justify-center transition-opacity duration-500 ease-[0.22,1,0.36,1] ${
          isFocused ? "opacity-30" : "opacity-100"
        }`}
      >
        <LyricPoster items={items} centered={true} />
      </div>

      {/* 2. Search Container with smooth editorial width expansion on focus */}
      <div
        ref={containerRef}
        className={`w-full transition-[max-width] duration-500 ease-[0.22,1,0.36,1] relative z-20 ${
          isFocused ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <form action="/" method="get">
          {artist && <input type="hidden" name="artist" value={artist} />}

          {/* Search Box Input Bar */}
          <div
            className={`relative flex items-center gap-2 border bg-background py-3 pl-5 pr-2.5 transition-colors duration-300 ${
              isFocused
                ? "border-accent"
                : "border-border hover:border-accent/60"
            }`}
          >
            {/* Search Icon Indicator */}
            <Search
              size={16}
              strokeWidth={1}
              className={`shrink-0 transition-colors ${
                isFocused ? "text-accent" : "text-muted-foreground"
              }`}
            />

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              name="q"
              defaultValue={initialQuery ?? ""}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isFocused) setIsFocused(true);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search title, artist, or lyrics..."
              className="w-full bg-transparent text-body font-light text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            {/* Clear Button */}
            <AnimatePresence>
              {query && (
                <motion.button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-accent transition-colors"
                >
                  <X size={14} strokeWidth={1} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Mic Voice Search Button */}
            <button
              type="button"
              onClick={toggleListening}
              aria-label={isListening ? "Stop voice search" : "Voice search"}
              className={`flex size-9 shrink-0 items-center justify-center border transition-colors ${
                isListening
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-muted text-foreground hover:border-accent hover:text-accent"
              }`}
            >
              <Mic size={16} strokeWidth={1} />
            </button>
          </div>
        </form>

        {/* ── Editorial Keyboard Shortcut Indicator (Penanda di bawahnya) ── */}
        <div className="mt-2.5 flex items-center justify-between px-1 text-caption uppercase tracking-widest text-muted-foreground select-none">
          <div className="flex items-center gap-1.5">
            <kbd className="font-mono text-[10px] border border-border bg-muted/40 px-1.5 py-0.5 text-foreground leading-none">
              /
            </kbd>
            <span className="text-[11px] text-muted-foreground">or</span>
            <kbd className="font-mono text-[10px] border border-border bg-muted/40 px-1.5 py-0.5 text-foreground leading-none">
              {isMac ? "⌘" : "Ctrl"} K
            </kbd>
            <span className="text-[11px] text-muted-foreground ml-0.5">to focus</span>
          </div>

          <div className="flex items-center gap-3">
            {showDropdown && flatResults.length > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                <kbd className="font-mono text-[10px] border border-border px-1 py-0.5 leading-none">↑</kbd>
                <kbd className="font-mono text-[10px] border border-border px-1 py-0.5 leading-none">↓</kbd>
                <span>navigate</span>
              </span>
            )}
            {isFocused && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <kbd className="font-mono text-[10px] border border-border px-1.5 py-0.5 leading-none">ESC</kbd>
                <span>close</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Realtime Results Dropdown (Attached Hairline Ledger) ── */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 top-[49px] border-x border-b border-accent bg-background max-h-[60vh] overflow-y-auto z-50 divide-y divide-border [contain:layout]"
            >
              {searchResults.total > 0 ? (
                <>
                  {/* Results Header */}
                  <div className="flex items-center justify-between px-5 py-2.5 bg-muted/20 text-caption uppercase tracking-widest text-muted-foreground">
                    <span>// {searchResults.total} {searchResults.total === 1 ? "match" : "matches"}</span>
                    <span>↵ to select</span>
                  </div>

                  {/* Songs Matches */}
                  {searchResults.songs.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-muted/40 text-caption uppercase tracking-widest text-muted-foreground border-b border-border">
                        Songs.
                      </div>
                      <div className="divide-y divide-border">
                        {searchResults.songs.map((song) => {
                          const itemIndex = flatResults.findIndex((x) => x.id === `song-${song.id}`);
                          const isSelected = itemIndex === selectedIndex;
                          const artistDisplay = song.featuring
                            ? `${song.artist} ft. ${song.featuring}`
                            : song.artist;

                          return (
                            <Link
                              key={song.id}
                              href={`/lyrics/${song.id}`}
                              onMouseEnter={() => setSelectedIndex(itemIndex)}
                              className={`group flex items-center justify-between px-5 py-3 transition-colors ${
                                isSelected ? "bg-muted/70 text-accent border-l-2 border-l-accent" : "hover:bg-muted/30"
                              }`}
                            >
                              <div className="min-w-0 pr-4">
                                <p className={`text-body-sm font-light transition-colors truncate ${
                                  isSelected ? "text-accent" : "text-foreground group-hover:text-accent"
                                }`}>
                                  {song.title}
                                </p>
                                <p className="text-caption uppercase text-muted-foreground tracking-wide truncate">
                                  {artistDisplay}
                                  {song.album && ` // ${song.album}`}
                                </p>

                                {song.matchedLyric && (
                                  <p className="mt-1 text-caption italic text-accent tracking-normal truncate">
                                    &ldquo;{song.matchedLyric}&rdquo;
                                  </p>
                                )}
                              </div>

                              <ArrowUpRight
                                size={16}
                                strokeWidth={1}
                                className={`shrink-0 transition-colors ${
                                  isSelected ? "text-accent" : "text-muted-foreground group-hover:text-accent"
                                }`}
                              />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Artists Matches */}
                  {searchResults.artists.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-muted/40 text-caption uppercase tracking-widest text-muted-foreground border-b border-border">
                        Artists.
                      </div>
                      <div className="divide-y divide-border">
                        {searchResults.artists.map((art) => {
                          const itemIndex = flatResults.findIndex((x) => x.id === `artist-${art.slug}`);
                          const isSelected = itemIndex === selectedIndex;

                          return (
                            <Link
                              key={art.slug}
                              href={`/artist/${art.slug}`}
                              onMouseEnter={() => setSelectedIndex(itemIndex)}
                              className={`group flex items-center justify-between px-5 py-3 transition-colors ${
                                isSelected ? "bg-muted/70 text-accent border-l-2 border-l-accent" : "hover:bg-muted/30"
                              }`}
                            >
                              <div className="min-w-0 pr-4">
                                <p className={`text-body-sm font-light transition-colors truncate ${
                                  isSelected ? "text-accent" : "text-foreground group-hover:text-accent"
                                }`}>
                                  {art.name}
                                </p>
                                <p className="text-caption uppercase text-muted-foreground tracking-wide">
                                  {art.songCount} {art.songCount === 1 ? "track" : "tracks"}
                                </p>
                              </div>

                              <ArrowUpRight
                                size={16}
                                strokeWidth={1}
                                className={`shrink-0 transition-colors ${
                                  isSelected ? "text-accent" : "text-muted-foreground group-hover:text-accent"
                                }`}
                              />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer Row */}
                  <div className="p-3 bg-muted/10 flex items-center justify-between text-caption uppercase tracking-wider">
                    <Link
                      href={`/songs?q=${encodeURIComponent(query)}`}
                      className="text-accent hover:underline"
                    >
                      View all in archive →
                    </Link>
                    <span className="text-muted-foreground">Press Enter</span>
                  </div>
                </>
              ) : (
                /* No Results */
                <div className="p-6 text-center">
                  <p className="text-body-sm font-light text-foreground">
                    No matches found for &ldquo;{query}&rdquo;.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening / Error feedback */}
        {(isListening || speechError) && (
          <div className="mt-2 flex items-center justify-between px-2 text-caption uppercase tracking-widest">
            {isListening ? (
              <span className="text-accent">
                // Listening // Speak or sing lyrics
              </span>
            ) : (
              <span className="text-destructive">
                // {speechError}
              </span>
            )}
          </div>
        )}

        {/* Filter status & Clear filter link */}
        {(initialQuery || artist) && (
          <div className="mt-4 flex items-center justify-between px-2 text-caption uppercase text-muted-foreground">
            <span>
              Filtered: {initialQuery && `"${initialQuery}"`} {artist && `(${artist})`}
            </span>
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-accent underline"
            >
              <X size={12} strokeWidth={1} /> Clear filter
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
