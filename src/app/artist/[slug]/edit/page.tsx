import { notFound } from "next/navigation";
import { eq, or, ilike } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { artists } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { EditArtistForm } from "@/components/edit-artist-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).trim();
  const slugified = decoded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const unhyphenated = decoded.replace(/-/g, " ").toLowerCase();

  const artistRecord = await db.query.artists.findFirst({
    where: or(
      eq(artists.slug, slugified),
      eq(artists.slug, decoded.toLowerCase()),
      ilike(artists.name, decoded),
      ilike(artists.name, unhyphenated)
    ),
  });

  const displayName = artistRecord?.name ?? decoded;
  return {
    title: `Edit: ${displayName} // Lyrarium`,
    description: `Edit profile, imagery, and biography for ${displayName}.`,
  };
}

export default async function EditArtistPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error } = await searchParams;
  const decoded = decodeURIComponent(slug).trim();
  const slugified = decoded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const unhyphenated = decoded.replace(/-/g, " ").toLowerCase();

  const artistRecord = await db.query.artists.findFirst({
    where: or(
      eq(artists.slug, slugified),
      eq(artists.slug, decoded.toLowerCase()),
      ilike(artists.name, decoded),
      ilike(artists.name, unhyphenated)
    ),
  });

  if (!artistRecord) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Breadcrumb navigation */}
      <div className="px-8 pt-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Artists", href: "/#artists" },
            { label: artistRecord.name, href: `/artist/${artistRecord.slug}` },
            { label: "Edit" },
          ]}
        />
      </div>

      <div className="px-8 pt-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-16 xl:gap-24">
          {/* Left Column: Minimalist Editorial Title */}
          <aside className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
            <div>
              <p className="text-caption uppercase text-muted-foreground tracking-widest">
                Artist Index // Edit
              </p>
              <h1 className="mt-4 text-heading font-light leading-heading tracking-[-0.023em] md:text-display md:leading-display md:tracking-[-0.04em]">
                Edit artist.
              </h1>
              <p className="mt-4 text-body-sm text-muted-foreground font-light leading-relaxed">
                Update artist name, portrait imagery, or biographical background in the archive.
              </p>
            </div>
          </aside>

          {/* Right Column: Structured Edit Form */}
          <div className="max-w-2xl">
            <EditArtistForm artist={artistRecord} error={error} />
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
