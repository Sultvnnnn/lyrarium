"use client";

import React, { useState, useRef, useEffect } from "react";
import { Feather, RotateCw } from "lucide-react";

export interface CachedInsight {
  content: string;
  model?: string | null;
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
  model?: string | null;
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
  const [lang, setLang] = useState<"id" | "en">(
    !initialInsights?.id && initialInsights?.en ? "en" : "id"
  );

  const [langStates, setLangStates] = useState<Record<"id" | "en", LangState>>({
    id: initialInsights?.id
      ? {
          status: "cached",
          content: cleanEmDashes(initialInsights.id.content),
          meta: {
            createdAt: initialInsights.id.createdAt,
            model: initialInsights.id.model,
          },
          errorMessage: null,
        }
      : { status: "idle", content: "", meta: null, errorMessage: null },
    en: initialInsights?.en
      ? {
          status: "cached",
          content: cleanEmDashes(initialInsights.en.content),
          meta: {
            createdAt: initialInsights.en.createdAt,
            model: initialInsights.en.model,
          },
          errorMessage: null,
        }
      : { status: "idle", content: "", meta: null, errorMessage: null },
  });

  // Track AbortControllers separately per language so switching tabs never kills active stream
  const abortControllersRef = useRef<Record<"id" | "en", AbortController | null>>({
    id: null,
    en: null,
  });

  // Sinkronisasi state saat navigasi antar lagu atau initialInsights berubah
  useEffect(() => {
    setLang(!initialInsights?.id && initialInsights?.en ? "en" : "id");
    setLangStates({
      id: initialInsights?.id
        ? {
            status: "cached",
            content: cleanEmDashes(initialInsights.id.content),
            meta: {
              createdAt: initialInsights.id.createdAt,
              model: initialInsights.id.model,
            },
            errorMessage: null,
          }
        : { status: "idle", content: "", meta: null, errorMessage: null },
      en: initialInsights?.en
        ? {
            status: "cached",
            content: cleanEmDashes(initialInsights.en.content),
            meta: {
              createdAt: initialInsights.en.createdAt,
              model: initialInsights.en.model,
            },
            errorMessage: null,
          }
        : { status: "idle", content: "", meta: null, errorMessage: null },
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

  const handleAskLyra = async (targetLang: "id" | "en" = lang) => {
    // Batalkan stream aktif untuk bahasa yang sama jika ada
    if (abortControllersRef.current[targetLang]) {
      abortControllersRef.current[targetLang]?.abort();
    }

    const controller = new AbortController();
    abortControllersRef.current[targetLang] = controller;

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

        if (data.cached) {
          setLangStates((prev) => ({
            ...prev,
            [targetLang]: {
              status: "cached",
              content: cleanEmDashes(data.content),
              meta: {
                createdAt: data.createdAt,
                model: data.model,
              },
              errorMessage: null,
            },
          }));
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

      // 3. Tangani live stream reader
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

      setLangStates((prev) => ({
        ...prev,
        [targetLang]: {
          status: "cached",
          content: accumulated,
          meta: {
            createdAt: new Date().toISOString(),
            model: "deepseek-v4.1-flash",
          },
          errorMessage: null,
        },
      }));
    } catch (err: any) {
      if (err.name === "AbortError") {
        setLangStates((prev) => {
          if (prev[targetLang].status === "loading") {
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
          <div className="mt-6 border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3 text-caption uppercase text-muted-foreground select-none">
            <span>
              Lyra is an AI and can make mistakes. Lyric interpretations are subjective.
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {current.meta?.model || "deepseek-v4.1-flash"}
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
