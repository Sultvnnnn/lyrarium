"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CornerDownLeft, Mic, Search, X } from "lucide-react";
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

// Helper untuk menemukan baris lirik pertama yang cocok dengan kata pencarian
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
  const [query, setQuery] = useState(initialQuery ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
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

  // Keyboard shortcut listener: ESC untuk keluar dari mode fokus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isFocused) {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);

  // Click outside listener untuk menutup fokus jika klik di luar search container
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

  // ── REALTIME SEARCH COMPUTATION ──
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { songs: [], artists: [], hasResults: false };
    }

    // 1. Filter Songs (title, artist, featuring, album, or matching lyrics snippet)
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

      if (matchingSongs.length >= 6) break; // Batasi maksimal 6 hasil teratas
    }

    // 2. Filter Artists
    const matchingArtists = searchableArtists
      .filter((a) => a.name.toLowerCase().includes(q) || (a.about?.toLowerCase().includes(q) ?? false))
      .slice(0, 4);

    return {
      songs: matchingSongs,
      artists: matchingArtists,
      hasResults: matchingSongs.length > 0 || matchingArtists.length > 0,
    };
  }, [query, searchableSongs, searchableArtists]);

  // Suggested popular artists untuk ditampilkan saat user pertama kali klik fokus tapi belum mengetik
  const suggestedArtists = useMemo(() => {
    return searchableArtists.slice(0, 5);
  }, [searchableArtists]);

  return (
    <>
      {/* ── BACKDROP OVERLAY (Saat Fokus Aktif) ── */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setIsFocused(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-background/85 dark:bg-black/80 backdrop-none cursor-pointer"
          />
        )}
      </AnimatePresence>

      <section className="relative flex flex-col items-center justify-center pt-8 pb-10 px-4 md:px-8">
        {/* 1. Kinetic Typographic Lyric Poster */}
        <div
          className={`mb-8 w-full flex justify-center transition-opacity duration-300 ${
            isFocused ? "opacity-30 pointer-events-none" : "opacity-100"
          }`}
        >
          <LyricPoster items={items} centered={true} />
        </div>

        {/* 2. Hero Search Box Card & Realtime Dropdown Container */}
        <div
          ref={containerRef}
          className={`w-full max-w-2xl transition-all duration-300 ${
            isFocused ? "relative z-50 scale-[1.01]" : "relative z-20 scale-100"
          }`}
        >
          {/* Status badge saat mode fokus aktif */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between pb-2 text-caption uppercase tracking-widest text-muted-foreground select-none"
              >
                <span className="flex items-center gap-2 text-accent font-medium">
                  <span className="inline-block size-1.5 bg-accent" />
                  Realtime Archive Search
                </span>
                <button
                  type="button"
                  onClick={() => setIsFocused(false)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors"
                >
                  <span className="text-[10px] border border-border px-1 py-0.5 font-mono">ESC</span>
                  <span>Close</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form action="/" method="get">
            {artist && <input type="hidden" name="artist" value={artist} />}

            <div
              className={`relative flex items-center gap-2 border bg-background py-2.5 pl-5 pr-2.5 transition-[border-color,background-color] duration-300 ${
                isFocused
                  ? "border-accent ring-1 ring-accent"
                  : "border-border bg-muted/30 hover:border-accent/60"
              }`}
            >
              {/* Text Input */}
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

              {/* Tombol Mic (Voice Search) */}
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

              {/* Tombol Submit Pencarian */}
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
          </form>

          {/* ── REALTIME SEARCH DROPDOWN PANEL ── */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.995 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 right-0 top-full mt-2 border border-border bg-background max-h-[68vh] overflow-y-auto z-50 divide-y divide-border"
              >
                {/* KONDISI 1: User sedang mengetik (Query ada teksnya) */}
                {query.trim().length > 0 ? (
                  searchResults.hasResults ? (
                    <div>
                      {/* Sub-section: Matching Songs */}
                      {searchResults.songs.length > 0 && (
                        <div>
                          <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center justify-between">
                            <span className="text-caption font-mono uppercase text-muted-foreground tracking-widest">
                              Tracks ({searchResults.songs.length})
                            </span>
                            <span className="text-caption uppercase text-accent tracking-widest font-medium">
                              Press to view lyrics
                            </span>
                          </div>

                          <div className="divide-y divide-border">
                            {searchResults.songs.map((song) => {
                              const artistDisplay = song.featuring
                                ? `${song.artist} ft. ${song.featuring}`
                                : song.artist;

                              return (
                                <Link
                                  key={song.id}
                                  href={`/lyrics/${song.id}`}
                                  className="group flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
                                >
                                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                                    {/* Square Image Thumbnail */}
                                    <div className="size-10 shrink-0 border border-border bg-muted overflow-hidden">
                                      {song.imageUrl ? (
                                        <img
                                          src={song.imageUrl}
                                          alt={song.title}
                                          className="size-full object-cover"
                                          loading="lazy"
                                          decoding="async"
                                        />
                                      ) : (
                                        <div className="size-full flex items-center justify-center text-caption font-mono uppercase text-muted-foreground">
                                          {song.title.charAt(0)}
                                        </div>
                                      )}
                                    </div>

                                    {/* Song Metadata & Matched Lyric Snippet */}
                                    <div className="min-w-0">
                                      <h4 className="text-body-sm font-light text-foreground group-hover:text-accent transition-colors truncate">
                                        {song.title}
                                      </h4>
                                      <p className="text-caption uppercase text-muted-foreground tracking-wide truncate">
                                        {artistDisplay}
                                        {song.album && ` // ${song.album}`}
                                      </p>

                                      {/* Highlight Baris Lirik yang Cocok */}
                                      {song.matchedLyric && (
                                        <p className="mt-1 text-caption italic text-accent tracking-normal truncate">
                                          &ldquo;{song.matchedLyric}&rdquo;
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex size-7 shrink-0 items-center justify-center border border-border text-muted-foreground group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                                    <ArrowUpRight size={14} strokeWidth={1} />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sub-section: Matching Artists */}
                      {searchResults.artists.length > 0 && (
                        <div>
                          <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center justify-between">
                            <span className="text-caption font-mono uppercase text-muted-foreground tracking-widest">
                              Artists ({searchResults.artists.length})
                            </span>
                            <span className="text-caption uppercase text-accent tracking-widest font-medium">
                              Dossier
                            </span>
                          </div>

                          <div className="divide-y divide-border">
                            {searchResults.artists.map((art) => (
                              <Link
                                key={art.slug}
                                href={`/artist/${art.slug}`}
                                className="group flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
                              >
                                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                                  {/* Square Artist Photo */}
                                  <div className="size-10 shrink-0 border border-border bg-muted overflow-hidden">
                                    {art.imageUrl ? (
                                      <img
                                        src={art.imageUrl}
                                        alt={art.name}
                                        className="size-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                      />
                                    ) : (
                                      <div className="size-full flex items-center justify-center text-caption font-mono uppercase text-muted-foreground">
                                        {art.name.charAt(0)}
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <h4 className="text-body-sm font-light text-foreground group-hover:text-accent transition-colors truncate">
                                      {art.name}
                                    </h4>
                                    <p className="text-caption uppercase text-muted-foreground tracking-wide">
                                      {art.songCount} {art.songCount === 1 ? "track preserved" : "tracks preserved"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex size-7 shrink-0 items-center justify-center border border-border text-muted-foreground group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                                  <ArrowUpRight size={14} strokeWidth={1} />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="p-3 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-caption uppercase tracking-wider">
                        <Link
                          href={`/songs?q=${encodeURIComponent(query)}`}
                          className="flex items-center gap-1.5 text-accent hover:underline font-medium"
                        >
                          <span>Explore all tracks matching &ldquo;{query}&rdquo;</span>
                          <ArrowUpRight size={14} strokeWidth={1} />
                        </Link>

                        <span className="text-muted-foreground flex items-center gap-1">
                          <CornerDownLeft size={12} strokeWidth={1} />
                          <span>Press Enter to filter archive</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Empty state saat query tidak menemukan hasil */
                    <div className="p-8 text-center">
                      <p className="text-body-sm font-light text-foreground">
                        No archive records found for &ldquo;{query}&rdquo;.
                      </p>
                      <p className="mt-1 text-caption uppercase text-muted-foreground tracking-widest">
                        Try checking spelling or search with a lyric snippet.
                      </p>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="mt-4 inline-flex items-center gap-2 border border-border px-3.5 py-1.5 text-caption uppercase tracking-widest text-foreground hover:border-accent hover:text-accent transition-colors"
                      >
                        <span>Clear query</span>
                      </button>
                    </div>
                  )
                ) : (
                  /* KONDISI 2: User baru klik fokus tapi belum mengetik teks */
                  <div className="p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="text-caption font-mono uppercase text-muted-foreground tracking-widest">
                        Quick Archive Suggestions
                      </span>
                      <span className="text-caption uppercase text-accent tracking-widest">
                        Realtime Index
                      </span>
                    </div>

                    <p className="mt-3 text-body-sm font-light text-muted-foreground leading-relaxed">
                      Type any song title, artist name, or memorable lyric snippet to see instant live results.
                    </p>

                    {suggestedArtists.length > 0 && (
                      <div className="mt-4">
                        <p className="text-caption uppercase text-muted-foreground tracking-widest mb-2.5">
                          Featured Artists
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedArtists.map((art) => (
                            <Link
                              key={art.slug}
                              href={`/artist/${art.slug}`}
                              className="border border-border px-3 py-1.5 text-caption uppercase tracking-widest text-foreground hover:border-accent hover:text-accent transition-colors"
                            >
                              <span>{art.name}</span>
                              <span className="ml-1.5 text-muted-foreground font-mono text-[11px]">
                                [{art.songCount}]
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
        </div>
      </section>
    </>
  );
}
