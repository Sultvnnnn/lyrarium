"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, User, Upload, X } from "lucide-react";
import { addArtist } from "@/app/actions/artists";

const inputCls =
  "w-full border border-border bg-transparent px-4 py-3 text-body font-light text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";

export function AddArtistForm({
  error,
  returnUrl,
}: {
  error?: string;
  returnUrl?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await addArtist(formData);
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

      {returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}

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
            required
            className={inputCls}
            placeholder="e.g. Pink Floyd, Kendrick Lamar, Radiohead"
          />
          <p className="text-caption text-muted-foreground">
            The primary name that will appear in the archive artist index and credits.
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
                  alt="Preview portrait"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <Upload size={16} strokeWidth={1} className="mb-2" />
                  <span className="text-[11px] uppercase tracking-wider">
                    Upload Photo
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between self-stretch gap-4">
              <div>
                <p className="text-body-sm text-foreground font-light">
                  Upload portrait or press photography for this artist
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
                    onClick={removeImage}
                    className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-caption uppercase text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    <X size={16} strokeWidth={1} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* About the Artist (Bio) */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="about"
            className="text-caption uppercase text-muted-foreground"
          >
            About the Artist (Bio)
          </label>
          <textarea
            id="about"
            name="about"
            rows={6}
            className={`${inputCls} leading-relaxed`}
            placeholder="Biography, history, origins, or editorial background of the artist..."
          />
          <p className="text-caption text-muted-foreground">
            This biography will be displayed on the artist profile and alongside all their archived songs.
          </p>
        </div>
      </section>

      {/* Submission & Cancel */}
      <section className="border-t border-border pt-8 flex flex-wrap items-center justify-between gap-6">
        <Link
          href={returnUrl || "/"}
          className="text-caption uppercase text-muted-foreground hover:text-accent transition-colors"
        >
          // Cancel & Return
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-3 border border-foreground bg-foreground px-8 py-4 text-body font-light text-background hover:border-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
        >
          <span>{isPending ? "Saving Artist..." : "Save Artist"}</span>
          <ArrowRight size={16} strokeWidth={1} />
        </button>
      </section>
    </form>
  );
}
