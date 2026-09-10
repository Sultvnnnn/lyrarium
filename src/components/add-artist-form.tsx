"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowRight, User } from "lucide-react";
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

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await addArtist(formData);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-12">
      {error && (
        <div className="border border-accent bg-accent/10 p-4">
          <p className="text-caption uppercase text-accent font-normal">
            Artist name is required.
          </p>
        </div>
      )}

      {returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}

      <section className="flex flex-col gap-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            01 // Artist Profile
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

        {/* About the Artist (Moved here from Add Song) */}
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
