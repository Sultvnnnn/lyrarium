import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in .env.local" },
        { status: 400 }
      );
    }

    const data = await req.formData();
    const file = data.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Forward audio stream to Groq Whisper model with native auto-language detection
    const groqFormData = new FormData();
    groqFormData.append("file", file, "audio.webm");
    groqFormData.append("model", "whisper-large-v3-turbo");
    groqFormData.append("response_format", "json");
    groqFormData.append("temperature", "0");
    groqFormData.append(
      "prompt",
      "Music lyrics, artist, and song title search in English or Indonesian. E.g. Tame Impala, Adrian Khalif, Raim Laode, Rizky Febian, KATSEYE, LE SSERAFIM, pop, rock, indie."
    );

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: groqFormData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Groq Whisper error:", res.status, errorText);
      return NextResponse.json(
        { error: `Groq Whisper error (${res.status})` },
        { status: res.status }
      );
    }

    const result = await res.json();
    let text = (result.text || "").trim();

    // Clean up surrounding quotes and trailing sentence punctuation for search bar use
    text = text
      .replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "")
      .replace(/[.,!?]+$/, "")
      .trim();

    return NextResponse.json({
      text,
    });
  } catch (err: any) {
    console.error("Transcribe API route error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error during transcription" },
      { status: 500 }
    );
  }
}
