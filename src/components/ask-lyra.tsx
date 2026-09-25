"use client";

import React, { useState, useRef, useEffect } from "react";
import { Feather, RotateCw } from "lucide-react";

interface AskLyraProps {
  songId: number;
  songTitle: string;
  artist: string;
  lyricsExcerpt?: string;
}

type LyraStatus = "idle" | "loading" | "streaming" | "cached" | "error";

interface LyraMeta {
  createdAt?: string | Date | null;
  model?: string | null;
}

function formatArchiveDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "Hari ini";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Hari ini";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Hari ini";
  }
}

export function AskLyra({
  songId,
  songTitle,
  artist,
  lyricsExcerpt,
}: AskLyraProps) {
  const [status, setStatus] = useState<LyraStatus>("idle");
  const [content, setContent] = useState<string>("");
  const [meta, setMeta] = useState<LyraMeta | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // Abort stream if user navigates away
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleAskLyra = async () => {
    // Batalkan request sebelumnya bila ada
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus("loading");
    setErrorMessage(null);
    setContent("");

    try {
      const res = await fetch("/api/lyra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ songId }),
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";

      // 1. Tangani respons JSON (cache hit atau pesan error)
      if (contentType.includes("application/json")) {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Gagal mendapatkan interpretasi dari Lyra.");
        }

        if (data.cached) {
          setContent(data.content);
          setMeta({
            createdAt: data.createdAt,
            model: data.model,
          });
          setStatus("cached");
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
        throw new Error(errText || "Terjadi kesalahan pada server Lyra.");
      }

      // 3. Tangani live stream delta
      if (!res.body) {
        throw new Error("Tidak ada stream body dari server.");
      }

      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setContent(accumulated);
      }

      setStatus("cached");
      setMeta({
        createdAt: new Date().toISOString(),
        model: "gpt-4o-mini",
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        return; // Client intentional abort
      }
      console.error("AskLyra Request Error:", err);
      setErrorMessage(
        err?.message || "Tidak dapat terhubung ke arsiparis Lyra saat ini."
      );
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Eyebrow Label & Title */}
      <div className="mb-6">
        <p className="text-caption uppercase tracking-widest text-muted-foreground">
          Lyra — Interpretasi
        </p>
      </div>

      {/* State Idle: Tombol Square Tanya Lyra */}
      {status === "idle" && (
        <div className="space-y-4">
          <p className="text-body-sm font-light text-muted-foreground max-w-xl">
            Minta telaah editorial mengenai lapisan puitis, konteks emosional, dan resonansi lirik &ldquo;{songTitle}&rdquo; oleh {artist}.
          </p>
          <button
            type="button"
            onClick={handleAskLyra}
            className="group inline-flex items-center gap-2.5 border border-border bg-background px-5 py-3 text-caption uppercase tracking-wider text-foreground transition-colors duration-200 hover:border-accent hover:text-accent cursor-pointer rounded-none select-none"
          >
            <Feather
              size={16}
              strokeWidth={1}
              className="text-muted-foreground transition-colors group-hover:text-accent"
            />
            <span>Tanya Lyra</span>
          </button>
        </div>
      )}

      {/* State Loading: Membaca lirik + hairline cursor berkedip */}
      {status === "loading" && (
        <div className="border-l border-accent pl-8 py-2">
          <div className="flex items-center gap-2 text-caption uppercase tracking-wider text-muted-foreground">
            <span>Lyra sedang membaca lirik…</span>
            <span
              className="inline-block w-px h-3.5 bg-accent animate-pulse will-change-[opacity]"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {/* State Streaming: Teks muncul bertahap + kursor */}
      {status === "streaming" && (
        <div className="border-l border-accent pl-8">
          <div className="whitespace-pre-line text-body leading-body text-foreground font-light">
            {content}
            <span
              className="inline-block w-px h-[1.1em] bg-accent ml-1 align-baseline animate-pulse will-change-[opacity]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-6 border-t border-border pt-3">
            <span className="text-caption uppercase tracking-wider text-muted-foreground">
              Lyra sedang mentranskripsi telaah…
            </span>
          </div>
        </div>
      )}

      {/* State Cached / Completed: Jawaban utuh + Meta Arsip */}
      {status === "cached" && (
        <div className="border-l border-accent pl-8">
          <div className="whitespace-pre-line text-body leading-body text-foreground font-light">
            {content}
          </div>
          <div className="mt-6 border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3 text-caption uppercase text-muted-foreground select-none">
            <span>
              Diarsipkan oleh Lyra — {formatArchiveDate(meta?.createdAt)} · model {meta?.model || "editorial"}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/60">
              Lyrarium Archive // Lyra
            </span>
          </div>
        </div>
      )}

      {/* State Error: Pesan error aksen + tombol Coba lagi */}
      {status === "error" && (
        <div className="border-l border-accent pl-8 space-y-4">
          <p className="text-caption uppercase tracking-wide text-accent">
            {errorMessage || "Gagal mendapatkan interpretasi dari Lyra."}
          </p>
          <div>
            <button
              type="button"
              onClick={handleAskLyra}
              className="group inline-flex items-center gap-2 border border-border bg-background px-4 py-2.5 text-caption uppercase tracking-wider text-foreground hover:border-accent hover:text-accent transition-colors duration-200 cursor-pointer rounded-none select-none"
            >
              <RotateCw
                size={16}
                strokeWidth={1}
                className="text-muted-foreground transition-colors group-hover:text-accent"
              />
              <span>Coba lagi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
