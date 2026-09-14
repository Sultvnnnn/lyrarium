"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, User, Upload, X } from "lucide-react";
import { updateArtist } from "@/app/actions/artists";

type ArtistData = {
  id: number;
  name: string;
  slug: string;
  about: string | null;
  imageUrl: string | null;
};

const inputCls =
  "w-full border border-border bg-transparent px-4 py-3 text-body font-light text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";

export function EditArtistForm({
  artist,
  error,
}: {
  artist: ArtistData;
  error?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(artist.name);
  const [about, setAbout] = useState(artist.about || "");
  const [imagePreview, setImagePreview] = useState<string | null>(
    artist.imageUrl
  );
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (formData: FormData) => {
    formData.set("id", String(artist.id));
    formData.set("oldSlug", artist.slug);
    formData.set("oldName", artist.name);
    formData.set("removeImage", removeImage ? "true" : "false");
    formData.set("currentImageUrl", artist.imageUrl || "");

    startTransition(async () => {
      await updateArtist(artist.id, formData);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-12">
      {error === "1" && (
        <div className="border border-accent bg-accent/10 p-4">
          <p className="text-caption uppercase text-accent font-normal">
            Artist name is required.
          </p>
        </div>
      )}
      {error === "large" && (
        <div className="border border-accent bg-accent/10 p-4">
          <p className="text-caption uppercase text-accent font-normal">
            Image file size exceeds the 5MB limit. Please choose a smaller file.
          </p>
        </div>
      )}

      {/* SECTION 1: PROFILE & IMAGERY */}
      <section className="flex flex-col gap-8">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            01 // Artist Profile & Imagery
          </p>
          <User size={16} strokeWidth={1} className="text-muted-foreground" />
        </div>

        {/* Artist Name */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="name"
            className="text-caption uppercase text-muted-foreground"
          >
            Artist Name <span className="text-accent">*</span>
          </label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputCls}
            placeholder="e.g. Pink Floyd, Kendrick Lamar, Radiohead"
          />
          <p className="text-caption text-muted-foreground">
            The primary name shown across the archive. Changing the name updates associated songs automatically.
          </p>
        </div>

        {/* Artist Portrait / Photo Upload */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="image"
            className="text-caption uppercase text-muted-foreground"
          >
            Artist Portrait / Photo
          </label>

          <input
            ref={fileInputRef}
            type="file"
            name="image"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border border-border p-5 bg-muted/10">
            {/* Sharp Preview Box */}
            <div className="size-36 shrink-0 border border-border bg-background flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={name || "Artist portrait"}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <Upload size={16} strokeWidth={1} className="mb-2" />
                  <span className="text-[11px] uppercase tracking-wider">
                    No Photo
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between self-stretch gap-4">
              <div>
                <p className="text-body-sm text-foreground font-light">
                  {imagePreview
                    ? "Existing artist portrait is set. You can change or remove it."
                    : "Upload portrait or press photography for this artist."}
                </p>
                <p className="text-caption text-muted-foreground mt-1">
                  1:1 square ratio recommended. JPEG, PNG, or WebP up to 5MB.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
                >
                  <Upload size={16} strokeWidth={1} />
                  <span>{imagePreview ? "Change Photo" : "Select File"}</span>
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-2 border border-border px-4 py-2 text-caption uppercase text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    <X size={16} strokeWidth={1} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: BIOGRAPHY & CONTEXT */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            02 // Biography & Context
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="about"
            className="text-caption uppercase text-muted-foreground"
          >
            About The Artist <span className="text-muted-foreground/60">(Optional)</span>
          </label>
          <textarea
            id="about"
            name="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={5}
            className={`${inputCls} text-body-sm leading-relaxed`}
            placeholder="Artist background, origin, discography notes, or biography..."
          />
          <p className="text-caption text-muted-foreground">
            Displayed on the artist's dossier page and liner note sidebars.
          </p>
        </div>
      </section>

      {/* SECTION 3: ACTIONS */}
      <section className="border-t border-border pt-8 flex flex-wrap items-center justify-between gap-6">
        <Link
          href={`/artist/${artist.slug}`}
          className="text-caption uppercase text-muted-foreground hover:text-accent transition-colors"
        >
          // Cancel & Discard
        </Link>

        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="flex items-center gap-3 border border-foreground bg-foreground px-8 py-4 text-body font-light text-background hover:border-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
        >
          <span>{isPending ? "Saving Profile..." : "Save Artist Profile"}</span>
          <ArrowRight size={16} strokeWidth={1} />
        </button>
      </section>
    </form>
  );
}
