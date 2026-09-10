import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AddSongForm } from "@/components/add-song-form";

export const dynamic = "force-dynamic";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="px-8 pt-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-16 xl:gap-24">
          {/* Left Column: Minimalist Editorial Title */}
          <aside className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
            <div>
              <p className="text-caption uppercase text-muted-foreground tracking-widest">
                Archive Entry // New
              </p>
              <h1 className="mt-4 text-heading font-light leading-heading tracking-[-0.023em] md:text-display md:leading-display md:tracking-[-0.04em]">
                Add a song.
              </h1>
            </div>
          </aside>

          {/* Right Column: Structured Form */}
          <div className="max-w-3xl">
            <AddSongForm error={error} />
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
