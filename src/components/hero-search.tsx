"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Mic, Search, X } from "lucide-react";
import { LyricPoster, type HeroItem } from "@/components/lyric-poster";
import type { Song } from "@/db/schema";
import type { AccordionArtist } from "@/components/artist-accordion";
import {
  searchFuzzy,
  type DidYouMeanSuggestion,
  type SearchEngineResult,
  type SearchableSong,
  type SearchableArtist,
} from "@/lib/search-engine";
import {
  buildTrigramIndex,
  searchFuzzySuggestions,
  type FuzzySuggestion,
  type TrigramIndex,
} from "@/lib/fuzzy";

type HeroSearchProps = {
  items: HeroItem[];
  initialQuery?: string;
  artist?: string;
  searchableSongs?: SearchableSong[];
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

// Helper: fallback bahasa speech recognition
function getAutoSpeechLanguage(): string {
  if (typeof navigator === "undefined") return "en-US";
  return navigator.language || "en-US";
}

// Helper: sintesis audio cue halus saat mic ditekan (Web Audio API)
function playMicCueSound(type: "start" | "stop") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "start") {
      // Nada lembut naik: 480Hz -> 720Hz
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      // Nada lembut turun: 720Hz -> 480Hz
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.11);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 180);
  } catch {}
}

// Helper: sintesis audio cue halus saat masuk & keluar mode fokus (Web Audio API)
function playFocusCueSound(type: "enter" | "exit") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "enter") {
      // Nada lembut naik tipis (terangkat & spotlight): 300Hz -> 460Hz
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.08);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // Nada lembut turun tipis (kembali): 440Hz -> 280Hz
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 150);
  } catch {}
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
  const deferredQuery = useDeferredValue(query);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isMac, setIsMac] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadAnimationRef = useRef<number | null>(null);
  const isTranscribingRef = useRef<boolean>(false);
  const hasSpokenRef = useRef<boolean>(false);
  const prevFocusedRef = useRef<boolean>(false);
  const hasMountedFocusRef = useRef<boolean>(false);

  useEffect(() => {
    isTranscribingRef.current = isTranscribing;
  }, [isTranscribing]);

  // Audio cue saat masuk dan keluar mode fokus
  useEffect(() => {
    if (!hasMountedFocusRef.current) {
      hasMountedFocusRef.current = true;
      prevFocusedRef.current = isFocused;
      return;
    }

    if (isFocused !== prevFocusedRef.current) {
      if (isFocused) {
        playFocusCueSound("enter");
      } else {
        playFocusCueSound("exit");
      }
      prevFocusedRef.current = isFocused;
    }
  }, [isFocused]);

  // Deteksi Mac OS untuk label shortcut (⌘ K vs Ctrl K)
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  // Bersihkan audio stream & timers saat unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
      if (vadAnimationRef.current) {
        cancelAnimationFrame(vadAnimationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Global Keyboard shortcuts:
  // "Ctrl+K" atau "Cmd+K" untuk memfokuskan search bar
  // "ESC" untuk keluar/unfocus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Abaikan shortcut jika fullscreen menu sedang terbuka
      if (document.body.getAttribute("data-menu-open") === "true") return;

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

  // Listener saat fullscreen menu overlay dibuka oleh user: otomatis unfocus searchbar
  useEffect(() => {
    const handleMenuToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ open: boolean }>;
      if (customEvent.detail?.open) {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("lyrarium-menu-toggle", handleMenuToggle);
    return () => window.removeEventListener("lyrarium-menu-toggle", handleMenuToggle);
  }, []);

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

  // Fallback: Web Speech API jika MediaRecorder tidak tersedia
  const startWebSpeechFallback = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Browser does not support microphone input.");
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getAutoSpeechLanguage();
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
          setSpeechError("Microphone error or permission denied.");
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

  // Stop recording audio and cleanup VAD audio context
  const stopRecording = (playCue = true) => {
    if (playCue) {
      playMicCueSound("stop");
    }

    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    if (vadAnimationRef.current) {
      cancelAnimationFrame(vadAnimationRef.current);
      vadAnimationRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  // Helper for realtime speech feedback while user is actively talking
  const sendInterimSnapshot = async () => {
    if (!hasSpokenRef.current || isTranscribingRef.current || audioChunksRef.current.length < 3) return;
    const partialBlob = new Blob(audioChunksRef.current, {
      type: mediaRecorderRef.current?.mimeType || "audio/webm",
    });
    if (partialBlob.size < 1200) return;

    try {
      const formData = new FormData();
      formData.append("file", partialBlob, "interim.webm");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text && mediaRecorderRef.current?.state === "recording") {
          setQuery(data.text);
          if (inputRef.current) {
            inputRef.current.value = data.text;
          }
          setIsFocused(true);
        }
      }
    } catch {}
  };

  // Start recording audio with noise cancellation & manual mic control
  const startRecording = async () => {
    setSpeechError(null);
    hasSpokenRef.current = false;
    playMicCueSound("start");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      startWebSpeechFallback();
      return;
    }

    try {
      // Noise cancellation, echo cancellation, auto gain control
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      // ── Setup AudioContext & AnalyserNode for Real-Time Equalizer & Periodic Snapshots ──
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      let lastInterimSnapshotTime = Date.now();

      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudioActivity = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const avg = sum / bufferLength;

          // Ambang batas vokal suara manusia yang jelas
          if (avg > 22) {
            hasSpokenRef.current = true;
          }

          const now = Date.now();
          // Periodic snapshot HANYA jika pengguna terbukti berbicara (bukan hening/noise latar)
          if (hasSpokenRef.current && avg > 16) {
            if (
              now - lastInterimSnapshotTime > 1500 &&
              audioChunksRef.current.length > 3 &&
              !isTranscribingRef.current
            ) {
              lastInterimSnapshotTime = now;
              sendInterimSnapshot();
            }
          }

          vadAnimationRef.current = requestAnimationFrame(checkAudioActivity);
        };

        vadAnimationRef.current = requestAnimationFrame(checkAudioActivity);
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        // Jika tidak ada suara vokal terdeteksi atau blob terlalu kecil, batalkan tanpa mengirim ke Whisper
        if (audioBlob.size < 500 || !hasSpokenRef.current) {
          setIsTranscribing(false);
          setSpeechError("No speech detected.");
          setTimeout(() => setSpeechError(null), 3000);
          return;
        }

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.text) {
            setQuery(data.text);
            if (inputRef.current) {
              inputRef.current.value = data.text;
              inputRef.current.focus();
            }
            setIsFocused(true);
          } else if (res.ok && !data.text) {
            setSpeechError("No speech detected. Please try again.");
            setTimeout(() => setSpeechError(null), 4000);
          } else if (data.error && data.error.includes("GROQ_API_KEY")) {
            setSpeechError("Please add GROQ_API_KEY to .env.local for Whisper auto-detect.");
            setTimeout(() => setSpeechError(null), 6000);
          } else if (data.error) {
            setSpeechError(data.error);
            setTimeout(() => setSpeechError(null), 4000);
          }
        } catch {
          setSpeechError("Transcription failed. Check connection.");
          setTimeout(() => setSpeechError(null), 4000);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      setIsListening(true);
      setIsFocused(true);

      // Safety timeout: auto stop setelah 30 detik jika mic dibiarkan menyala tanpa ditutup
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
    } catch {
      setSpeechError("Microphone permission denied.");
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording(true);
    } else {
      startRecording();
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

  const applySuggestion = (text: string) => {
    setQuery(text);
    if (inputRef.current) {
      inputRef.current.value = text;
      inputRef.current.focus();
    }
  };

  // ── Pre-computed Inverted Trigram Index for zero-latency candidate pruning ──
  const trigramIndex = useMemo<TrigramIndex>(() => {
    const dictionaryItems: Array<{
      id: string;
      text: string;
      type: "song" | "artist";
      targetId: number | string;
      url: string;
      subtitle?: string;
    }> = [];

    const seenSongTitles = new Set<string>();
    const seenArtists = new Set<string>();

    for (const s of searchableSongs) {
      const titleLower = s.title.toLowerCase().trim();
      if (titleLower && !seenSongTitles.has(titleLower)) {
        seenSongTitles.add(titleLower);
        const artistDisplay = s.featuring ? `${s.artist} ft. ${s.featuring}` : s.artist;
        dictionaryItems.push({
          id: `song-${s.id}`,
          text: s.title,
          type: "song",
          targetId: s.id,
          url: `/lyrics/${s.id}`,
          subtitle: artistDisplay,
        });
      }

      const artistLower = s.artist.toLowerCase().trim();
      if (artistLower && !seenArtists.has(artistLower)) {
        seenArtists.add(artistLower);
        const slug = s.artist
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        dictionaryItems.push({
          id: `artist-${slug}`,
          text: s.artist,
          type: "artist",
          targetId: slug,
          url: `/artist/${slug}`,
          subtitle: "Artist",
        });
      }

      if (s.featuring) {
        for (const feat of s.featuring.split(/,\s*/)) {
          const fTrim = feat.trim();
          const fLower = fTrim.toLowerCase();
          if (fTrim && !seenArtists.has(fLower)) {
            seenArtists.add(fLower);
            const slug = fTrim
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            dictionaryItems.push({
              id: `artist-${slug}`,
              text: fTrim,
              type: "artist",
              targetId: slug,
              url: `/artist/${slug}`,
              subtitle: "Artist",
            });
          }
        }
      }
    }

    for (const a of searchableArtists) {
      const aLower = a.name.toLowerCase().trim();
      if (aLower && !seenArtists.has(aLower)) {
        seenArtists.add(aLower);
        dictionaryItems.push({
          id: `artist-${a.slug}`,
          text: a.name,
          type: "artist",
          targetId: a.slug,
          url: `/artist/${a.slug}`,
          subtitle: `${a.songCount ?? 0} ${a.songCount === 1 ? "track" : "tracks"}`,
        });
      }
    }

    return buildTrigramIndex(dictionaryItems);
  }, [searchableSongs, searchableArtists]);

  // ── Fuzzy suggestions calculation on deferred query (never blocks main keystroke thread) ──
  const fuzzyResults = useMemo(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      return { suggestions: [], didYouMean: null };
    }
    return searchFuzzySuggestions(trimmed, trigramIndex, {
      maxSuggestions: 6,
      didYouMeanThreshold: 0.52,
    });
  }, [deferredQuery, trigramIndex]);

  // ── Realtime search calculation using searchFuzzy engine ──
  const searchResults = useMemo(() => {
    if (!deferredQuery.trim()) {
      return {
        query: "",
        hasExactMatches: false,
        suggestion: null,
        exactMatches: { songs: [], artists: [], total: 0 },
        fuzzyMatches: { songs: [], artists: [], total: 0 },
      };
    }
    return searchFuzzy(deferredQuery, searchableSongs, searchableArtists);
  }, [deferredQuery, searchableSongs, searchableArtists]);

  // Determine active songs & artists to display in dropdown
  const isFuzzyMode = !searchResults.hasExactMatches && searchResults.fuzzyMatches.total > 0;
  const activeSongs = searchResults.hasExactMatches
    ? searchResults.exactMatches.songs
    : searchResults.fuzzyMatches.songs;
  const activeArtists = searchResults.hasExactMatches
    ? searchResults.exactMatches.artists
    : searchResults.fuzzyMatches.artists;
  const activeTotal = activeSongs.length + activeArtists.length;

  // Did-You-Mean active item
  const activeDidYouMean =
    activeTotal < 3 && fuzzyResults.didYouMean
      ? fuzzyResults.didYouMean
      : activeTotal === 0 && searchResults.suggestion
      ? {
          id: `dym-${searchResults.suggestion.suggestedText}`,
          text: searchResults.suggestion.suggestedText,
          type: (searchResults.suggestion.type === "song" ? "song" : "artist") as "song" | "artist",
          targetId: searchResults.suggestion.suggestedText,
          url: searchResults.suggestion.url,
          score: searchResults.suggestion.confidence,
          highlightSegments: [{ text: searchResults.suggestion.suggestedText, isMatch: false }],
        }
      : null;

  // Combobox selectable list: suggestions first, then direct song & artist result cards
  type ComboboxOption =
    | { id: string; kind: "suggestion"; text: string; url?: string }
    | { id: string; kind: "song"; text: string; url: string }
    | { id: string; kind: "artist"; text: string; url: string };

  const selectableOptions = useMemo<ComboboxOption[]>(() => {
    const list: ComboboxOption[] = [];
    for (let i = 0; i < fuzzyResults.suggestions.length; i++) {
      const s = fuzzyResults.suggestions[i];
      list.push({
        id: `search-option-${i}`,
        kind: "suggestion",
        text: s.text,
        url: s.url,
      });
    }
    const sugCount = list.length;
    for (let i = 0; i < activeSongs.length; i++) {
      const s = activeSongs[i];
      list.push({
        id: `search-option-${sugCount + i}`,
        kind: "song",
        text: s.title,
        url: `/lyrics/${s.id}`,
      });
    }
    const songsCount = activeSongs.length;
    for (let i = 0; i < activeArtists.length; i++) {
      const a = activeArtists[i];
      list.push({
        id: `search-option-${sugCount + songsCount + i}`,
        kind: "artist",
        text: a.name,
        url: `/artist/${a.slug}`,
      });
    }
    return list;
  }, [fuzzyResults.suggestions, activeSongs, activeArtists]);

  const hasQuery = query.trim().length > 0;
  const showDropdown = isFocused && hasQuery;

  // Keyboard navigation handler untuk input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && activeDidYouMean) {
      e.preventDefault();
      applySuggestion(activeDidYouMean.text);
      return;
    }

    if (e.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === "ArrowDown") {
      if (selectableOptions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < selectableOptions.length - 1 ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === "ArrowUp") {
      if (selectableOptions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : selectableOptions.length - 1));
      }
      return;
    }

    if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectableOptions[selectedIndex]) {
        e.preventDefault();
        const selected = selectableOptions[selectedIndex];
        if (selected.kind === "suggestion") {
          applySuggestion(selected.text);
        } else {
          router.push(selected.url);
          setIsFocused(false);
        }
      } else {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  return (
    <>
      {/* ── Focus Mode Backdrop (Spotlight Focus) ── */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setIsFocused(false)}
            className="fixed inset-0 z-20 bg-background/80 cursor-pointer"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <section className="flex flex-col items-center justify-center pt-8 pb-10 px-4 md:px-8 relative">
        {/* 1. Kinetic Typographic Lyric Poster */}
        <div
          className={`mb-8 w-full flex justify-center transition-opacity duration-500 ease-[0.22,1,0.36,1] ${
            isFocused ? "opacity-20 pointer-events-none" : "opacity-100"
          }`}
        >
          <LyricPoster items={items} centered={true} />
        </div>

        {/* 2. Search Container with smooth editorial width expansion & lift animation on focus */}
        <div
          ref={containerRef}
          className={`w-full transition-[max-width,transform] duration-500 ease-[0.22,1,0.36,1] relative ${
            isFocused ? "z-30 max-w-3xl -translate-y-2.5" : "z-10 max-w-xl translate-y-0"
          }`}
        >
          <form action="/" method="get">
            {artist && <input type="hidden" name="artist" value={artist} />}

            {/* Search Box Input Bar */}
            <div
              className={`relative flex items-center gap-2 border bg-background py-3 pl-5 pr-2.5 transition-colors duration-500 ease-[0.22,1,0.36,1] ${
                isFocused
                  ? "border-accent"
                  : "border-border hover:border-accent"
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

            {/* Input with WAI-ARIA Combobox pattern */}
            <input
              ref={inputRef}
              type="text"
              name="q"
              role="combobox"
              aria-label="Search title, artist, or lyrics"
              aria-expanded={showDropdown}
              aria-controls="search-suggestions-list"
              aria-autocomplete="list"
              aria-activedescendant={
                selectedIndex >= 0 && selectableOptions[selectedIndex]
                  ? selectableOptions[selectedIndex].id
                  : undefined
              }
              defaultValue={initialQuery ?? ""}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
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
                  <X size={16} strokeWidth={1} />
                </motion.button>
              )}
            </AnimatePresence>


            {/* Mic Voice Search Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isTranscribing}
              aria-label={
                isTranscribing
                  ? "Transcribing voice..."
                  : isListening
                  ? "Stop voice search"
                  : "Voice search"
              }
              className={`flex size-9 shrink-0 items-center justify-center border transition-colors ${
                isListening
                  ? "border-accent bg-accent text-accent-foreground"
                  : isTranscribing
                  ? "border-accent bg-muted text-accent cursor-wait"
                  : "border-border bg-muted text-foreground hover:border-accent hover:text-accent"
              }`}
            >
              <Mic size={16} strokeWidth={1} className={isTranscribing ? "animate-pulse" : ""} />
            </button>
          </div>
        </form>

        {/* ── Status or Keyboard Shortcut Indicator ── */}
        <div className="mt-2.5 flex items-center justify-between px-1 text-caption uppercase tracking-widest text-muted-foreground select-none">
          {isListening ? (
            <div className="flex items-center gap-2.5 text-accent text-caption uppercase tracking-widest">
              {/* Dynamic Live Equalizer (Voice Activity Wave — GPU Compositor Keyframes) */}
              <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
                <span className="w-0.5 h-3 bg-accent animate-eq-1" />
                <span className="w-0.5 h-3 bg-accent animate-eq-2" />
                <span className="w-0.5 h-3 bg-accent animate-eq-3" />
                <span className="w-0.5 h-3 bg-accent animate-eq-4" />
              </span>
              <span>// Listening... (click mic to finish)</span>
            </div>
          ) : isTranscribing ? (
            <div className="flex items-center gap-2 text-accent text-caption uppercase tracking-widest">
              <span className="inline-block size-1.5 bg-accent animate-pulse shrink-0" />
              <span>// Transcribing...</span>
            </div>
          ) : speechError ? (
            <div className="text-destructive text-caption uppercase tracking-widest">
              // {speechError}
            </div>
          ) : (
            <>
              {!isFocused ? (
                <div className="flex items-center gap-1.5">
                  <kbd className="font-mono text-[10px] border border-border bg-muted/40 px-1.5 py-0.5 text-foreground leading-none">
                    {isMac ? "⌘" : "Ctrl"} K
                  </kbd>
                  <span className="text-[11px] text-muted-foreground ml-0.5">for quick search</span>
                </div>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                {activeDidYouMean && (
                  <span className="hidden sm:flex items-center gap-1 text-[11px] text-accent">
                    <kbd className="font-mono text-[10px] border border-accent/40 bg-accent/10 px-1 py-0.5 leading-none">Tab</kbd>
                    <span>suggest</span>
                  </span>
                )}
                {showDropdown && selectableOptions.length > 0 && (
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
            </>
          )}
        </div>

        {/* ── Realtime Results Dropdown (Attached Hairline Ledger) ── */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              id="search-suggestions-list"
              role="listbox"
              aria-label="Search suggestions"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 top-[49px] border-x border-b border-border bg-background max-h-[60vh] overflow-y-auto z-30 divide-y divide-border [contain:layout]"
            >
              {/* Did-you-mean: jika hasil == 0 (atau < 3) dan fuzzy menemukan kandidat kuat */}
              {activeDidYouMean && (
                <div className="flex items-center justify-between px-5 py-2.5 bg-muted/40 border-b border-border flex-wrap gap-2 text-body-sm font-light select-none">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-caption uppercase tracking-wider text-muted-foreground">
                      Maksud Anda:
                    </span>
                    <button
                      type="button"
                      onClick={() => applySuggestion(activeDidYouMean.text)}
                      className="font-medium text-accent hover:underline cursor-pointer transition-colors decoration-1 underline-offset-4"
                    >
                      {activeDidYouMean.text}
                    </button>
                    <span className="text-caption uppercase text-muted-foreground font-mono text-[10px] border border-border px-1.5 py-0.5">
                      {activeDidYouMean.type === "song" ? "SONG" : "ARTIST"}
                    </span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground hidden sm:inline">
                    Klik atau <kbd className="font-mono text-[10px] border border-border px-1 py-0.5">Tab</kbd> untuk mencari
                  </span>
                </div>
              )}

              {/* Typeahead Suggestions (max 5-8 options with <mark> match highlight & uppercase caption) */}
              {fuzzyResults.suggestions.length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-muted/20 text-caption uppercase tracking-widest text-muted-foreground border-b border-border flex items-center justify-between select-none">
                    <span>// Saran ({fuzzyResults.suggestions.length})</span>
                    <span className="font-mono text-[10px] hidden sm:inline">↑↓ arahkan • ↵ pilih</span>
                  </div>
                  <div className="divide-y divide-border">
                    {fuzzyResults.suggestions.map((sug, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={sug.id}
                          id={`search-option-${idx}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => applySuggestion(sug.text)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`group flex items-center justify-between px-5 py-2.5 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-muted/70 text-accent border-l-2 border-l-accent"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <div className="min-w-0 pr-4">
                            <p
                              className={`text-body-sm font-light transition-colors truncate ${
                                isSelected ? "text-accent" : "text-foreground group-hover:text-accent"
                              }`}
                            >
                              {sug.highlightSegments.map((seg, sIdx) =>
                                seg.isMatch ? (
                                  <mark
                                    key={sIdx}
                                    className="bg-accent text-accent-foreground font-normal"
                                  >
                                    {seg.text}
                                  </mark>
                                ) : (
                                  <span key={sIdx}>{seg.text}</span>
                                )
                              )}
                            </p>
                            {sug.subtitle && (
                              <p className="text-caption uppercase text-muted-foreground tracking-wide truncate">
                                {sug.subtitle}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-caption uppercase tracking-widest text-muted-foreground font-mono text-[10px] border border-border px-1.5 py-0.5 select-none">
                              {sug.type === "song" ? "SONG" : "ARTIST"}
                            </span>
                            <ArrowUpRight
                              size={16}
                              strokeWidth={1}
                              className={`transition-colors ${
                                isSelected
                                  ? "text-accent"
                                  : "text-muted-foreground group-hover:text-accent"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Direct Matches (Songs & Artists) */}
              {activeTotal > 0 ? (
                <>
                  {/* Results Header */}
                  <div className="flex items-center justify-between px-5 py-2.5 bg-muted/20 text-caption uppercase tracking-widest text-muted-foreground">
                    <span>
                      // {isFuzzyMode ? "Approximate matches" : "Matches"} ({activeTotal})
                    </span>
                    <span>↵ to select</span>
                  </div>

                  {/* Songs Matches */}
                  {activeSongs.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-muted/40 text-caption uppercase tracking-widest text-muted-foreground border-b border-border">
                        Songs.
                      </div>
                      <div className="divide-y divide-border">
                        {activeSongs.map((song, songIdx) => {
                          const optionIdx = fuzzyResults.suggestions.length + songIdx;
                          const isSelected = optionIdx === selectedIndex;
                          const artistDisplay = song.featuring
                            ? `${song.artist} ft. ${song.featuring}`
                            : song.artist;

                          return (
                            <Link
                              key={song.id}
                              id={`search-option-${optionIdx}`}
                              role="option"
                              aria-selected={isSelected}
                              href={`/lyrics/${song.id}`}
                              onMouseEnter={() => setSelectedIndex(optionIdx)}
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
                  {activeArtists.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-muted/40 text-caption uppercase tracking-widest text-muted-foreground border-b border-border">
                        Artists.
                      </div>
                      <div className="divide-y divide-border">
                        {activeArtists.map((art, artIdx) => {
                          const optionIdx =
                            fuzzyResults.suggestions.length + activeSongs.length + artIdx;
                          const isSelected = optionIdx === selectedIndex;

                          return (
                            <Link
                              key={art.slug}
                              id={`search-option-${optionIdx}`}
                              role="option"
                              aria-selected={isSelected}
                              href={`/artist/${art.slug}`}
                              onMouseEnter={() => setSelectedIndex(optionIdx)}
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
                      href={`/songs?q=${encodeURIComponent(activeDidYouMean ? activeDidYouMean.text : query)}`}
                      className="text-accent hover:underline"
                    >
                      View all in archive →
                    </Link>
                    <span className="text-muted-foreground">Press Enter</span>
                  </div>
                </>
              ) : fuzzyResults.suggestions.length === 0 ? (
                /* No Results & No Suggestions */
                <div className="p-6 text-center">
                  <p className="text-body-sm font-light text-foreground">
                    No matches found for &ldquo;{query}&rdquo;.
                  </p>
                  <p className="mt-1 text-caption uppercase tracking-wider text-muted-foreground">
                    Try checking for spelling errors or searching by artist name
                  </p>
                </div>
              ) : (
                /* Suggestions exist but 0 exact direct matches */
                <div className="p-3 bg-muted/10 flex items-center justify-between text-caption uppercase tracking-wider">
                  <Link
                    href={`/songs?q=${encodeURIComponent(activeDidYouMean ? activeDidYouMean.text : query)}`}
                    className="text-accent hover:underline"
                  >
                    Search in archive anyway →
                  </Link>
                  <span className="text-muted-foreground">Press Enter</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>


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
              <X size={16} strokeWidth={1} /> Clear filter
            </Link>
          </div>
        )}
      </div>
    </section>
    </>
  );
}
