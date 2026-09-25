"use client";

import React, { useState, useRef, useEffect } from "react";
import { Feather, RotateCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface CachedInsight {
  content: string;
  createdAt?: string | Date | null;
}

export interface AskLyraProps {
  songId: number;
  songTitle: string;
  artist: string;
  lyricsExcerpt?: string;
  initialInsights?: {
    id?: CachedInsight | null;
    en?: CachedInsight | null;
  };
}

type LyraStatus = "idle" | "loading" | "streaming" | "cached" | "error";

interface LyraMeta {
  createdAt?: string | Date | null;
}

interface LangState {
  status: LyraStatus;
  content: string;
  meta: LyraMeta | null;
  errorMessage: string | null;
}

function cleanEmDashes(text: string): string {
  if (!text) return "";
  return text.replace(/[\u2014\u2015]/g, " - ").replace(/\u2013/g, "-");
}

const THINKING_PHRASES: Record<"en" | "id", string[]> = {
  en: [
    "Thinking…",
    "Pondering the verses…",
    "Decoding hidden metaphors…",
    "Tracing the emotional arc…",
    "Listening between the lines…",
    "Unraveling the subtext…",
  ],
  id: [
    "Sedang berpikir…",
    "Meresapi bait demi bait…",
    "Menerjemahkan metafora tersirat…",
    "Menelusuri alur emosi…",
    "Mendengarkan di balik kata…",
    "Menelaah subteks lirik…",
  ],
};

const SIMULATED_THINKING_MS = 3800;

function delayWithSignal(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }
    const timeout = setTimeout(() => resolve(true), ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        resolve(false);
      },
      { once: true }
    );
  });
}

export function AskLyra({
  songId,
  songTitle,
  artist,
  initialInsights,
}: AskLyraProps) {
  // 1. Default to English
  const [lang, setLang] = useState<"id" | "en">("en");

  // 2. Both languages start in "idle" state on initial render (user must click button first)
  const [langStates, setLangStates] = useState<Record<"id" | "en", LangState>>({
    id: { status: "idle", content: "", meta: null, errorMessage: null },
    en: { status: "idle", content: "", meta: null, errorMessage: null },
  });

  // Simpan data cache lokal (dari server hydration atau hasil fetch) untuk streaming cepat tanpa buang token
  const cachedInsightsRef = useRef<Record<"id" | "en", CachedInsight | null>>({
    id: initialInsights?.id || null,
    en: initialInsights?.en || null,
  });

  // Track AbortControllers separately per language so switching tabs never kills active stream
  const abortControllersRef = useRef<Record<"id" | "en", AbortController | null>>({
    id: null,
    en: null,
  });

  // Reset saat navigasi antar lagu
  useEffect(() => {
    cachedInsightsRef.current = {
      id: initialInsights?.id || null,
      en: initialInsights?.en || null,
    };
    setLang("en");
    setLangStates({
      id: { status: "idle", content: "", meta: null, errorMessage: null },
      en: { status: "idle", content: "", meta: null, errorMessage: null },
    });
  }, [songId, initialInsights?.id?.content, initialInsights?.en?.content]);

  useEffect(() => {
    return () => {
      // Abort active streams if component unmounts
      abortControllersRef.current.id?.abort();
      abortControllersRef.current.en?.abort();
    };
  }, []);

  const current = langStates[lang];

  // Siklus kata-kata berpikir dinamis saat status loading
  const [thinkingPhraseIndex, setThinkingPhraseIndex] = useState(0);

  useEffect(() => {
    if (current.status !== "loading") {
      setThinkingPhraseIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setThinkingPhraseIndex((prev) => (prev + 1) % THINKING_PHRASES[lang].length);
    }, 2000);

    return () => clearInterval(interval);
  }, [current.status, lang]);

  // Helper untuk streaming halus token-per-token dari cache (menghasilkan efek typewriter tanpa biaya token API)
  const streamCachedContent = async (
    targetLang: "id" | "en",
    fullContent: string,
    meta: LyraMeta | null,
    signal: AbortSignal
  ) => {
    setLangStates((prev) => ({
      ...prev,
      [targetLang]: {
        status: "streaming",
        content: "",
        meta: null,
        errorMessage: null,
      },
    }));

    const tokens = fullContent.split(/(\s+)/);
    let accumulated = "";
    const stepSize = 2; // 2 token per tick untuk ritme editorial yang dinamis

    for (let i = 0; i < tokens.length; i += stepSize) {
      if (signal.aborted) return;
      accumulated += tokens.slice(i, i + stepSize).join("");

      setLangStates((prev) => ({
        ...prev,
        [targetLang]: {
          ...prev[targetLang],
          content: accumulated,
        },
      }));

      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    if (signal.aborted) return;

    setLangStates((prev) => ({
      ...prev,
      [targetLang]: {
        status: "cached",
        content: fullContent,
        meta,
        errorMessage: null,
      },
    }));
  };

  const handleAskLyra = async (targetLang: "id" | "en" = lang) => {
    // Batalkan stream aktif untuk bahasa yang sama jika ada
    if (abortControllersRef.current[targetLang]) {
      abortControllersRef.current[targetLang]?.abort();
    }

    const controller = new AbortController();
    abortControllersRef.current[targetLang] = controller;

    // A. Jika sudah ada di cache lokal (dari server hydration atau fetch sebelumnya):
    // Tampilkan simulasi pemikiran terlebih dahulu (~3.8 detik) agar terasa hidup & puitis
    const existingCache = cachedInsightsRef.current[targetLang];
    if (existingCache?.content) {
      setLangStates((prev) => ({
        ...prev,
        [targetLang]: {
          status: "loading",
          content: "",
          meta: null,
          errorMessage: null,
        },
      }));

      const completed = await delayWithSignal(SIMULATED_THINKING_MS, controller.signal);
      if (!completed || controller.signal.aborted) return;

      await streamCachedContent(
        targetLang,
        cleanEmDashes(existingCache.content),
        {
          createdAt: existingCache.createdAt,
        },
        controller.signal
      );
      return;
    }

    // B. Jika belum ada di cache lokal, panggil /api/lyra (live streaming dari AI provider atau DB cache)
    setLangStates((prev) => ({
      ...prev,
      [targetLang]: {
        status: "loading",
        content: "",
        meta: null,
        errorMessage: null,
      },
    }));

    const startTime = Date.now();

    try {
      const res = await fetch("/api/lyra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ songId, lang: targetLang }),
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";

      // 1. Tangani respons JSON (cache hit dari database atau error)
      if (contentType.includes("application/json")) {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
              (targetLang === "en"
                ? "Failed to retrieve interpretation from Lyra."
                : "Gagal mendapatkan interpretasi dari Lyra.")
          );
        }

        if (data.cached && data.content) {
          cachedInsightsRef.current[targetLang] = {
            content: data.content,
            createdAt: data.createdAt,
          };

          // Jika database merespons sangat cepat (< 3.8s), penuhi jeda berpikir agar ada rasa pemikiran alami
          const elapsed = Date.now() - startTime;
          const remainingThinking = Math.max(0, SIMULATED_THINKING_MS - elapsed);
          if (remainingThinking > 0) {
            const completed = await delayWithSignal(remainingThinking, controller.signal);
            if (!completed || controller.signal.aborted) return;
          }

          await streamCachedContent(
            targetLang,
            cleanEmDashes(data.content),
            {
              createdAt: data.createdAt,
            },
            controller.signal
          );
          return;
        }
      }

      // 2. Tangani status error non-JSON
      if (!res.ok) {
        let errText = "";
        try {
          errText = await res.text();
        } catch {
          errText = res.statusText;
        }
        throw new Error(
          errText ||
            (targetLang === "en"
              ? "An error occurred with Lyra server."
              : "Terjadi kesalahan pada server Lyra.")
        );
      }

      // 3. Tangani live stream reader dari provider AI
      if (!res.body) {
        throw new Error(
          targetLang === "en"
            ? "No stream body received from server."
            : "Tidak ada stream body dari server."
        );
      }

      setLangStates((prev) => ({
        ...prev,
        [targetLang]: {
          ...prev[targetLang],
          status: "streaming",
        },
      }));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        const sanitizedChunk = cleanEmDashes(rawChunk);
        accumulated += sanitizedChunk;

        setLangStates((prev) => ({
          ...prev,
          [targetLang]: {
            ...prev[targetLang],
            content: accumulated,
          },
        }));
      }

      cachedInsightsRef.current[targetLang] = {
        content: accumulated,
        createdAt: new Date().toISOString(),
      };

      setLangStates((prev) => ({
        ...prev,
        [targetLang]: {
          status: "cached",
          content: accumulated,
          meta: {
            createdAt: new Date().toISOString(),
          },
          errorMessage: null,
        },
      }));
    } catch (err: any) {
      if (err.name === "AbortError") {
        setLangStates((prev) => {
          if (prev[targetLang].status === "loading" || prev[targetLang].status === "streaming") {
            return {
              ...prev,
              [targetLang]: {
                status: "idle",
                content: "",
                meta: null,
                errorMessage: null,
              },
            };
          }
          return prev;
        });
        return;
      }
      console.error("AskLyra Request Error:", err);
      setLangStates((prev) => ({
        ...prev,
        [targetLang]: {
          ...prev[targetLang],
          status: "error",
          errorMessage:
            err?.message ||
            (targetLang === "en"
              ? "Unable to connect to Lyra at this moment."
              : "Tidak dapat terhubung ke arsiparis Lyra saat ini."),
        },
      }));
    }
  };

  const handleLanguageSwitch = (newLang: "id" | "en") => {
    if (newLang === lang) return;
    setLang(newLang);
  };

  return (
    <div className="w-full">
      {/* Header bar: Eyebrow on left, Kinetic Language Toggle on far right */}
      <div className="mb-6 flex items-center justify-between gap-4 select-none">
        <p className="text-caption uppercase tracking-widest text-muted-foreground">
          Lyra // {lang === "en" ? "Interpretation" : "Interpretasi"}
        </p>

        {/* Kinetic Sliding Language Toggle (same style as artist discography album switcher) */}
        <div className="relative inline-flex items-stretch border border-border bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => handleLanguageSwitch("id")}
            aria-label="Bahasa Indonesia"
            className={`relative z-10 px-4 py-1.5 text-caption uppercase font-mono tracking-wider transition-colors cursor-pointer select-none ${
              lang === "id"
                ? "text-background font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>ID</span>
            {lang === "id" && (
              <motion.div
                layoutId="activeLyraLanguageTab"
                className="absolute inset-0 bg-foreground -z-10"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleLanguageSwitch("en")}
            aria-label="English"
            className={`relative z-10 px-4 py-1.5 text-caption uppercase font-mono tracking-wider transition-colors cursor-pointer select-none ${
              lang === "en"
                ? "text-background font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>EN</span>
            {lang === "en" && (
              <motion.div
                layoutId="activeLyraLanguageTab"
                className="absolute inset-0 bg-foreground -z-10"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Animated Language Transition Container */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={lang}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* State Idle: Tombol Square Tanya Lyra / Ask Lyra */}
          {current.status === "idle" && (
            <div className="space-y-3.5">
              <p className="text-body-sm font-light text-muted-foreground">
                {lang === "en"
                  ? "What does this song truly mean? Explore the story and emotion behind the lyrics."
                  : "Apa sebenarnya makna di balik lagu ini? Telusuri cerita dan emosi di balik liriknya."}
              </p>
              <button
                type="button"
                onClick={() => handleAskLyra(lang)}
                className="group inline-flex items-center gap-2 border border-border bg-background px-4 py-2 text-caption uppercase tracking-wider text-foreground transition-colors duration-200 hover:border-accent hover:text-accent cursor-pointer rounded-none select-none"
              >
                <Feather
                  size={16}
                  strokeWidth={1}
                  className="text-muted-foreground transition-colors group-hover:text-accent"
                />
                <span>{lang === "en" ? "Ask Lyra" : "Tanya Lyra"}</span>
              </button>
            </div>
          )}

          {/* State Loading: Animasi berpikir dinamis bergantian + hairline cursor berkedip */}
          {current.status === "loading" && (
            <div className="border-l border-accent pl-8 py-2">
              <div className="flex items-center gap-2 text-caption uppercase tracking-wider text-muted-foreground min-h-[1.5rem]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${lang}-${thinkingPhraseIndex}`}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {THINKING_PHRASES[lang][thinkingPhraseIndex % THINKING_PHRASES[lang].length]}
                  </motion.span>
                </AnimatePresence>
                <Loader2
                  size={16}
                  strokeWidth={1}
                  className="animate-spin text-accent shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          {/* State Streaming: Teks muncul bertahap + kursor (em-dash sanitized) */}
          {current.status === "streaming" && (
            <div className="border-l border-accent pl-8">
              <div className="whitespace-pre-line text-body leading-body text-foreground font-light">
                {cleanEmDashes(current.content)}
                <span
                  className="inline-block w-px h-[1.1em] bg-accent ml-1 align-baseline animate-pulse will-change-[opacity]"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-5 border-t border-border pt-3">
                <span className="text-caption uppercase tracking-wider text-muted-foreground">
                  {lang === "en"
                    ? "Transcribing…"
                    : "Mentranskripsi…"}
                </span>
              </div>
            </div>
          )}

          {/* State Cached / Completed: Jawaban utuh + AI Disclaimer Bahasa Inggris */}
          {current.status === "cached" && (
            <div className="border-l border-accent pl-8">
              <div className="whitespace-pre-line text-body leading-body text-foreground font-light">
                {cleanEmDashes(current.content)}
              </div>
              <div className="mt-5 border-t border-border pt-4 text-caption uppercase text-muted-foreground select-none">
                <span>
                  Lyra is an AI and can make mistakes. Lyric interpretations are subjective.
                </span>
              </div>
            </div>
          )}

          {/* State Error: Pesan error aksen + tombol Coba lagi */}
          {current.status === "error" && (
            <div className="border-l border-accent pl-8 space-y-4">
              <p className="text-caption uppercase tracking-wide text-accent">
                {current.errorMessage ||
                  (lang === "en"
                    ? "Failed to obtain interpretation from Lyra."
                    : "Gagal mendapatkan interpretasi dari Lyra.")}
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => handleAskLyra(lang)}
                  className="group inline-flex items-center gap-2 border border-border bg-background px-4 py-2 text-caption uppercase tracking-wider text-foreground hover:border-accent hover:text-accent transition-colors duration-200 cursor-pointer rounded-none select-none"
                >
                  <RotateCw
                    size={16}
                    strokeWidth={1}
                    className="text-muted-foreground transition-colors group-hover:text-accent"
                  />
                  <span>{lang === "en" ? "Try again" : "Coba lagi"}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
