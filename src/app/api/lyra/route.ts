import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { songs, lyraInsights } from "@/db/schema";
import {
  buildLyraPrompt,
  getLyraConfig,
  LYRA_SYSTEM_PROMPT,
  streamLyra,
  type LyraChatMessage,
} from "@/lib/lyra";

// In-memory rate limiting: maksimal 5 request per menit per IP
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const entry = rateLimitMap.get(ip);

  // Bersihkan entri kedaluwarsa jika ukuran Map > 1000
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt < now) rateLimitMap.delete(key);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= 5) {
    return true; // Rate limit terlampaui
  }

  entry.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  // 1. Ekstraksi IP & Rate Limiting (5 req / menit)
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan ke Lyra. Harap tunggu satu menit." },
      { status: 429 }
    );
  }

  // 2. Validasi Request Body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON tidak valid." },
      { status: 400 }
    );
  }

  const songId = body?.songId;
  if (typeof songId !== "number" || !Number.isInteger(songId)) {
    return NextResponse.json(
      { error: "songId harus berupa integer valid." },
      { status: 400 }
    );
  }

  // 3. Verifikasi lagu ada di database
  const song = await db.query.songs.findFirst({
    where: eq(songs.id, songId),
  });

  if (!song) {
    return NextResponse.json(
      { error: "Lagu tidak ditemukan di arsip." },
      { status: 404 }
    );
  }

  // 4. Cek cache lyra_insights by songId
  const cached = await db.query.lyraInsights.findFirst({
    where: eq(lyraInsights.songId, songId),
  });

  if (cached) {
    return NextResponse.json({
      cached: true,
      content: cached.content,
      createdAt: cached.createdAt,
      model: cached.model,
    });
  }

  // 5. Cek ketersediaan konfigurasi provider
  const { apiKey, model } = getLyraConfig();
  if (!apiKey) {
    return NextResponse.json(
      { error: "LYRA_API_KEY belum dikonfigurasi di environment server." },
      { status: 502 }
    );
  }

  // 6. Siapkan prompt & panggil provider stream
  const prompt = buildLyraPrompt(song);
  const messages: LyraChatMessage[] = [
    { role: "system", content: LYRA_SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];

  let iterator: AsyncGenerator<string, void, unknown>;
  let firstChunkResult: IteratorResult<string, void>;

  try {
    iterator = streamLyra(messages, req.signal);
    firstChunkResult = await iterator.next();
  } catch (err: any) {
    console.error("Provider Lyra Error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal menghubungi provider AI." },
      { status: 502 }
    );
  }

  // 7. Streaming delta ke client + akumulasi untuk disimpan ke cache saat selesai
  let accumulatedText = "";
  let isAborted = false;

  req.signal.addEventListener("abort", () => {
    isAborted = true;
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        // Enqueue chunk pertama jika ada
        if (!firstChunkResult.done && typeof firstChunkResult.value === "string") {
          accumulatedText += firstChunkResult.value;
          controller.enqueue(encoder.encode(firstChunkResult.value));
        }

        // Iterasi chunk berikutnya dari generator
        for await (const chunk of iterator) {
          if (isAborted || req.signal.aborted) {
            break;
          }
          accumulatedText += chunk;
          controller.enqueue(encoder.encode(chunk));
        }

        controller.close();

        // 8. INSERT ke lyra_insights HANYA jika stream sukses tanpa dibatalkan
        if (!isAborted && !req.signal.aborted && accumulatedText.trim().length > 0) {
          try {
            await db
              .insert(lyraInsights)
              .values({
                songId: song.id,
                content: accumulatedText.trim(),
                model,
              })
              .onConflictDoNothing();
          } catch (insertErr) {
            console.error("Gagal menyimpan hasil Lyra ke database:", insertErr);
          }
        }
      } catch (streamErr: any) {
        if (isAborted || req.signal.aborted) {
          try {
            controller.close();
          } catch {}
          return;
        }
        controller.error(streamErr);
      }
    },
    cancel() {
      isAborted = true;
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
