"use client";

import React, { useState, useRef, useEffect } from "react";
import { Feather, RotateCw } from "lucide-react";

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

    // A. Jika sudah ada di cache lokal (dari server hydration atau fetch sebelumnya), stream langsung tanpa buang token!
    const existingCache = cachedInsightsRef.current[targetLang];
    if (existingCache?.content) {
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

    // B. Jika belum ada di cache, panggil /api/lyra (live streaming dari AI provider)
    setLangStates((prev) => ({
      ...prev,
      [targetLang]: {
        status: "loading",
        content: "",
        meta: null,
        errorMessage: null,
      },
    }));

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
    <div className="w-full max-w-4xl">
      {/* Header bar: Eyebrow + Language Toggle */}
      <div className="mb-6 flex items-center justify-between gap-4 select-none">
        <p className="text-caption uppercase tracking-widest text-muted-foreground">
          Lyra — {lang === "en" ? "Interpretation" : "Interpretasi"}
        </p>

        {/* Language Toggle: ID | EN */}
        <div className="flex items-center border border-border divide-x divide-border">
          <button
            type="button"
            onClick={() => handleLanguageSwitch("id")}
            aria-label="Bahasa Indonesia"
            className={`px-2.5 py-1 text-caption uppercase font-mono tracking-wider transition-colors cursor-pointer ${
              lang === "id"
                ? "bg-foreground text-background font-normal"
                : "text-muted-foreground hover:text-accent hover:bg-muted/40"
            }`}
          >
            ID
          </button>
          <button
            type="button"
            onClick={() => handleLanguageSwitch("en")}
            aria-label="English"
            className={`px-2.5 py-1 text-caption uppercase font-mono tracking-wider transition-colors cursor-pointer ${
              lang === "en"
                ? "bg-foreground text-background font-normal"
                : "text-muted-foreground hover:text-accent hover:bg-muted/40"
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* State Idle: Tombol Square Tanya Lyra / Ask Lyra */}
      {current.status === "idle" && (
        <div className="space-y-4">
          <p className="text-body-sm font-light text-muted-foreground max-w-xl">
            {lang === "en"
              ? `Request an editorial analysis exploring the poetic layers, emotional resonance, and lyrical themes of "${songTitle}" by ${artist}.`
              : `Minta telaah editorial mengenai lapisan puitis, konteks emosional, dan resonansi lirik "${songTitle}" oleh ${artist}.`}
          </p>
          <button
            type="button"
            onClick={() => handleAskLyra(lang)}
            className="group inline-flex items-center gap-2.5 border border-border bg-background px-5 py-3 text-caption uppercase tracking-wider text-foreground transition-colors duration-200 hover:border-accent hover:text-accent cursor-pointer rounded-none select-none"
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

      {/* State Loading: Membaca lirik + hairline cursor berkedip */}
      {current.status === "loading" && (
        <div className="border-l border-accent pl-8 py-2">
          <div className="flex items-center gap-2 text-caption uppercase tracking-wider text-muted-foreground">
            <span>
              {lang === "en"
                ? "Lyra is reading the lyrics…"
                : "Lyra sedang membaca lirik…"}
            </span>
            <span
              className="inline-block w-px h-3.5 bg-accent animate-pulse will-change-[opacity]"
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
          <div className="mt-6 border-t border-border pt-3">
            <span className="text-caption uppercase tracking-wider text-muted-foreground">
              {lang === "en"
                ? "Lyra is transcribing the interpretation…"
                : "Lyra sedang mentranskripsi telaah…"}
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
          <div className="mt-6 border-t border-border pt-4 text-caption uppercase text-muted-foreground select-none">
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
              className="group inline-flex items-center gap-2 border border-border bg-background px-4 py-2.5 text-caption uppercase tracking-wider text-foreground hover:border-accent hover:text-accent transition-colors duration-200 cursor-pointer rounded-none select-none"
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
    </div>
  );
}
