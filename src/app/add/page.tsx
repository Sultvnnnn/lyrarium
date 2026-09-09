import { addSong } from "@/app/actions/songs";
import { SiteHeader } from "@/components/site-header";

const inputCls =
  "w-full resize-y border border-border bg-transparent px-4 py-3 text-body text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="max-w-2xl px-8 pt-16 pb-24">
        <p className="text-caption uppercase text-muted-foreground">
          New entry
        </p>
        <h1 className="mt-6 text-heading font-light leading-heading tracking-[-0.023em]">
          Add a song
        </h1>

        {error && (
          <p className="mt-8 text-caption uppercase text-accent">
            {error === "large"
              ? "File terlalu besar (max 5MB)"
              : "Semua field wajib diisi"}
          </p>
        )}

        <form action={addSong} className="mt-12 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="title"
              className="text-caption uppercase text-muted-foreground"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              className={inputCls}
              placeholder="Bohemian Rhapsody"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="artist"
              className="text-caption uppercase text-muted-foreground"
            >
              Artist
            </label>
            <input
              id="artist"
              name="artist"
              required
              className={inputCls}
              placeholder="Queen"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="lyrics"
              className="text-caption uppercase text-muted-foreground"
            >
              Lyrics
            </label>
            <textarea
              id="lyrics"
              name="lyrics"
              required
              rows={10}
              className={inputCls}
              placeholder="Is this the real life?"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="image"
              className="text-caption uppercase text-muted-foreground"
            >
              Upload image (opsional)
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="w-full border border-border bg-transparent px-4 py-3 text-body-sm text-foreground file:mr-4 file:border-0 file:bg-accent file:px-4 file:py-2 file:text-accent-foreground file:text-caption file:uppercase focus:border-accent focus:outline-none"
            />
            <p className="text-caption text-muted-foreground">
              Max 5MB. JPG, PNG, WebP.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="aboutArtist"
              className="text-caption uppercase text-muted-foreground"
            >
              About artist (opsional)
            </label>
            <textarea
              id="aboutArtist"
              name="aboutArtist"
              rows={4}
              className={inputCls}
              placeholder="Short bio of the artist..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="credits"
              className="text-caption uppercase text-muted-foreground"
            >
              Credits (opsional)
            </label>
            <textarea
              id="credits"
              name="credits"
              rows={4}
              className={inputCls}
              placeholder={"Written by: ...\nProduced by: ..."}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="youtubeUrl"
              className="text-caption uppercase text-muted-foreground"
            >
              YouTube URL (opsional)
            </label>
            <input
              id="youtubeUrl"
              name="youtubeUrl"
              className={inputCls}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <button
              type="submit"
              className="rounded-pills bg-foreground px-6 py-3 text-body text-background hover:bg-accent hover:text-accent-foreground"
            >
              Simpan
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
