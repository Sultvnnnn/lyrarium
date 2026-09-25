/**
 * Lyra Editorial Lyrics Interpreter Provider Adapter
 * Zero-dependency OpenAI-compatible SSE streaming client
 */

export const LYRA_SYSTEM_PROMPT =
  "Kamu adalah Lyra, arsiparis dan interpreter lirik untuk Lyrarium, arsip lirik editorial. Jawab dalam Bahasa Indonesia dengan nada editorial yang tenang dan presisi — bukan nada chatbot marketing. Struktur jawaban: (1) satu paragraf tema besar lagu; (2) makna bagian-bagian kunci dengan mengutip baris liriknya secara singkat; (3) konteks emosional dan alternatif interpretasi — sampaikan sebagai kemungkinan, bukan kebenaran mutlak. Dilarang: emoji, markdown heading, klikbait, meminta data pribadi. Maksimum 500 kata.";

export interface LyraSongInput {
  title: string;
  artist: string;
  lyrics: string;
  album?: string | null;
  featuring?: string | null;
}

export function buildLyraPrompt(song: LyraSongInput): string {
  // Payload lirik dibatasi maksimal 6000 karakter pertama
  const safeLyrics = (song.lyrics || "").slice(0, 6000);
  const featuring = song.featuring ? ` (feat. ${song.featuring})` : "";
  const album = song.album ? `Album: ${song.album}\n` : "";

  return `Judul: ${song.title}
Artis: ${song.artist}${featuring}
${album}
Lirik:
${safeLyrics}`;
}

export interface LyraChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function getLyraConfig() {
  const apiKey = process.env.LYRA_API_KEY?.trim();
  const baseUrl = (process.env.LYRA_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.LYRA_MODEL?.trim() || "gpt-4o-mini";

  return { apiKey, baseUrl, model };
}

/**
 * Streams completion tokens from an OpenAI-compatible endpoint.
 * Enforces a strict 30-second timeout via AbortController and yields text deltas.
 */
export async function* streamLyra(
  messages: LyraChatMessage[],
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const { apiKey, baseUrl, model } = getLyraConfig();

  if (!apiKey) {
    throw new Error("LYRA_API_KEY belum dikonfigurasi di environment server.");
  }

  // Timeout 30 detik via AbortController
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error("Permintaan ke Lyra timeout setelah 30 detik."));
  }, 30000);

  // Hubungkan sinyal pembatalan dari caller (misal client disconnect)
  const onCallerAbort = () => {
    timeoutController.abort(signal?.reason || new Error("Permintaan dibatalkan oleh klien."));
  };

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw signal.reason || new Error("Permintaan sudah dibatalkan.");
    }
    signal.addEventListener("abort", onCallerAbort, { once: true });
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.6,
        max_tokens: 1200,
      }),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      let errorDetail = "";
      try {
        const errorJson = await response.json();
        errorDetail = errorJson?.error?.message || JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text().catch(() => response.statusText);
      }
      throw new Error(`Provider API error (${response.status}): ${errorDetail}`);
    }

    if (!response.body) {
      throw new Error("Provider tidak mengembalikan response body stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Simpan potongan baris terakhir yang belum lengkap di buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") {
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            yield delta;
          }
        } catch {
          // Abaikan chunk SSE non-JSON atau format provider khusus
        }
      }
    }

    // Flush sisa buffer jika ada
    if (buffer.trim().startsWith("data:")) {
      const dataStr = buffer.trim().slice(5).trim();
      if (dataStr !== "[DONE]") {
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            yield delta;
          }
        } catch {}
      }
    }
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener("abort", onCallerAbort);
    }
  }
}
