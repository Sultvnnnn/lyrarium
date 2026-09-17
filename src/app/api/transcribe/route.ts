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

    // Filter common Whisper hallucinations on silent/ambient audio
    const HALLUCINATIONS = [
      /^thank you[.!?,]?$/i,
      /^thanks for watching[.!?,]?$/i,
      /^thank you for watching[.!?,]?$/i,
      /^subtitles by/i,
      /^you[.!?,]?$/i,
      /^bye[.!?,]?$/i,
      /^music[.!?,]?$/i,
      /^applause[.!?,]?$/i,
      /^silence[.!?,]?$/i,
      /^blank audio[.!?,]?$/i,
    ];

    if (HALLUCINATIONS.some((pattern) => pattern.test(text))) {
      text = "";
    }

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
