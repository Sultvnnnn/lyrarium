"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { Plus, X, Upload, ArrowRight, Music, Disc } from "lucide-react";
import { addSong } from "@/app/actions/songs";
import { serializeCredits, type StructuredCredit } from "@/lib/credits";

type CustomCreditRow = {
  id: string;
  role: string;
  names: string;
};

const inputCls =
  "w-full border border-border bg-transparent px-4 py-3 text-body font-light text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";

export function AddSongForm({ error }: { error?: string }) {
  const [isPending, startTransition] = useTransition();

  // Field states
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");

  // Standard Credits
  const [writers, setWriters] = useState("");
  const [producers, setProducers] = useState("");
  const [featuring, setFeaturing] = useState("");
  const [engineering, setEngineering] = useState("");

  // Custom Credits
  const [customCredits, setCustomCredits] = useState<CustomCreditRow[]>([]);

  // Image preview state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lyrics statistics
  const lineCount = lyrics.split("\n").filter((l) => l.trim().length > 0).length;
  const wordCount = lyrics.split(/\s+/).filter(Boolean).length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addCustomCreditRow = () => {
    setCustomCredits((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 9), role: "", names: "" },
    ]);
  };

  const removeCustomCreditRow = (id: string) => {
    setCustomCredits((prev) => prev.filter((row) => row.id !== id));
  };

  const updateCustomCreditRow = (
    id: string,
    field: "role" | "names",
    value: string
  ) => {
    setCustomCredits((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = (formData: FormData) => {
    const creditsList: StructuredCredit[] = [];

    // Main Artist
    if (artist.trim()) {
      creditsList.push({
        role: "Main Artist",
        names: [artist.trim()],
      });
    }

    if (featuring.trim()) {
      creditsList.push({
        role: "Featuring",
        names: featuring.split(/,\s*/).map((s) => s.trim()).filter(Boolean),
      });
    }

    if (writers.trim()) {
      creditsList.push({
        role: "Writer",
        names: writers.split(/,\s*/).map((s) => s.trim()).filter(Boolean),
      });
    }

    if (producers.trim()) {
      creditsList.push({
        role: "Producer",
        names: producers.split(/,\s*/).map((s) => s.trim()).filter(Boolean),
      });
    }

    if (engineering.trim()) {
      creditsList.push({
        role: "Mixing & Mastering",
        names: engineering.split(/,\s*/).map((s) => s.trim()).filter(Boolean),
      });
    }

    // Custom roles
    for (const row of customCredits) {
      if (row.role.trim() && row.names.trim()) {
        creditsList.push({
          role: row.role.trim(),
          names: row.names.split(/,\s*/).map((s) => s.trim()).filter(Boolean),
        });
      }
    }

    const json = serializeCredits(creditsList);
    if (json) {
      formData.set("credits_json", json);
    }

    startTransition(async () => {
      await addSong(formData);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-16">
      {error && (
        <div className="border border-accent bg-accent/10 p-4">
          <p className="text-caption uppercase text-accent font-normal">
            {error === "large"
              ? "Image file is too large (maximum 5MB)."
              : "All required fields (Title, Artist, and Lyrics) must be completed."}
          </p>
        </div>
      )}

      {/* SECTION 1: THE ESSENTIALS */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            01 // The Essentials
          </p>
          <span className="text-caption uppercase text-accent font-normal">
            * Required
          </span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="title"
            className="text-caption uppercase text-muted-foreground"
          >
            Song Title <span className="text-accent">*</span>
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputCls}
            placeholder="e.g. Bohemian Rhapsody"
          />
        </div>

        {/* Main Artist */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="artist"
            className="text-caption uppercase text-muted-foreground"
          >
            Main Artist <span className="text-accent">*</span>
          </label>
          <input
            id="artist"
            name="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            required
            className={inputCls}
            placeholder="e.g. Queen"
          />
          <p className="text-caption text-muted-foreground">
            Primary artist name indexed in the archive.
          </p>
        </div>

        {/* Lyrics */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="lyrics"
              className="text-caption uppercase text-muted-foreground"
            >
              Lyrics <span className="text-accent">*</span>
            </label>
            <span className="text-caption uppercase text-muted-foreground">
              {lineCount} lines · {wordCount} words
            </span>
          </div>
          <textarea
            id="lyrics"
            name="lyrics"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            required
            rows={12}
            className={`${inputCls} font-mono text-body-sm leading-relaxed`}
            placeholder="Type or paste complete song lyrics here..."
          />
        </div>
      </section>

      {/* SECTION 2: CREDITS & PERSONNEL */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <p className="text-caption uppercase text-muted-foreground tracking-widest">
              02 // Credits & Personnel
            </p>
            <p className="mt-1 text-caption text-muted-foreground">
              Song credits will be rendered as editorial liner notes on the lyrics page.
            </p>
          </div>
          <Disc size={16} strokeWidth={1} className="text-muted-foreground" />
        </div>

        {/* Writers / Songwriters */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="credits_writers"
            className="text-caption uppercase text-muted-foreground"
          >
            Songwriters / Composers
          </label>
          <input
            id="credits_writers"
            value={writers}
            onChange={(e) => setWriters(e.target.value)}
            className={inputCls}
            placeholder="e.g. Freddie Mercury (separate multiple with commas)"
          />
        </div>

        {/* Producers */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="credits_producers"
            className="text-caption uppercase text-muted-foreground"
          >
            Producers
          </label>
          <input
            id="credits_producers"
            value={producers}
            onChange={(e) => setProducers(e.target.value)}
            className={inputCls}
            placeholder="e.g. Roy Thomas Baker, Queen"
          />
        </div>

        {/* Featuring Artists */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="credits_featuring"
            className="text-caption uppercase text-muted-foreground"
          >
            Featuring Artists
          </label>
          <input
            id="credits_featuring"
            value={featuring}
            onChange={(e) => setFeaturing(e.target.value)}
            className={inputCls}
            placeholder="e.g. David Bowie"
          />
        </div>

        {/* Audio Engineering / Mixing & Mastering */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="credits_engineering"
            className="text-caption uppercase text-muted-foreground"
          >
            Audio Engineering (Mixing & Mastering)
          </label>
          <input
            id="credits_engineering"
            value={engineering}
            onChange={(e) => setEngineering(e.target.value)}
            className={inputCls}
            placeholder="e.g. Bob Ludwig, Trident Studios"
          />
        </div>

        {/* Custom Credits Rows */}
        {customCredits.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-caption uppercase text-muted-foreground">
              Additional Custom Roles:
            </p>
            {customCredits.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-3 border border-border p-3"
              >
                <div className="w-1/3">
                  <input
                    value={row.role}
                    onChange={(e) =>
                      updateCustomCreditRow(row.id, "role", e.target.value)
                    }
                    placeholder="Role Title (e.g. Arranger)"
                    className="w-full border-b border-border bg-transparent px-2 py-1 text-caption uppercase text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <input
                    value={row.names}
                    onChange={(e) =>
                      updateCustomCreditRow(row.id, "names", e.target.value)
                    }
                    placeholder="Personnel names (comma separated)"
                    className="w-full border-b border-border bg-transparent px-2 py-1 text-body-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCustomCreditRow(row.id)}
                  aria-label="Remove role"
                  className="flex size-8 shrink-0 items-center justify-center border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  <X size={14} strokeWidth={1} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Credit Button */}
        <div>
          <button
            type="button"
            onClick={addCustomCreditRow}
            className="inline-flex items-center gap-2 border border-dashed border-border px-4 py-2.5 text-caption uppercase text-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus size={14} strokeWidth={1} />
            <span>+ Add Custom Role</span>
          </button>
        </div>
      </section>

      {/* SECTION 3: MEDIA & CONTEXT */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            03 // Media & Context (Optional)
          </p>
          <Music size={16} strokeWidth={1} className="text-muted-foreground" />
        </div>

        {/* Cover Art Upload with 1:1 Sharp Preview */}
        <div className="flex flex-col gap-3">
          <label
            htmlFor="image"
            className="text-caption uppercase text-muted-foreground"
          >
            Cover Artwork (1:1 Square)
          </label>

          <div className="flex flex-col sm:flex-row items-start gap-6 border border-border p-6 bg-muted/20">
            {/* 1:1 Sharp Preview Box */}
            <div className="size-36 shrink-0 border border-border bg-background flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview cover"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <Upload size={20} strokeWidth={1} className="mb-2" />
                  <span className="text-[11px] uppercase tracking-wider">
                    1:1 Square
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between self-stretch gap-4">
              <div>
                <p className="text-body-sm text-foreground font-light">
                  Upload square cover art or editorial song poster.
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  Supported formats: JPG, PNG, WebP (max 5MB).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer border border-foreground bg-foreground px-4 py-2 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors">
                  Choose File
                  <input
                    ref={fileInputRef}
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="border border-border px-4 py-2 text-caption uppercase text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* YouTube Embed URL */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="youtubeUrl"
            className="text-caption uppercase text-muted-foreground"
          >
            YouTube Video URL
          </label>
          <input
            id="youtubeUrl"
            name="youtubeUrl"
            className={inputCls}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-caption text-muted-foreground">
            Will be embedded as a responsive video player on the lyrics page.
          </p>
        </div>

        {/* About Artist */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="aboutArtist"
            className="text-caption uppercase text-muted-foreground"
          >
            About the Artist
          </label>
          <textarea
            id="aboutArtist"
            name="aboutArtist"
            rows={4}
            className={inputCls}
            placeholder="Brief biography or background information about the artist..."
          />
        </div>
      </section>

      {/* SECTION 4: ACTIONS & SUBMIT */}
      <section className="border-t border-border pt-8 flex flex-wrap items-center justify-between gap-6">
        <Link
          href="/"
          className="text-caption uppercase text-muted-foreground hover:text-accent transition-colors"
        >
          // Cancel & Return to Archive
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-3 border border-foreground bg-foreground px-8 py-4 text-body font-light text-background hover:border-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
        >
          <span>{isPending ? "Saving Song..." : "Save Song to Archive"}</span>
          <ArrowRight size={16} strokeWidth={1} />
        </button>
      </section>
    </form>
  );
}
