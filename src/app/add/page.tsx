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
          {/* Kolom Kiri: Editorial Sticky Header */}
          <aside className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-6">
            <div>
              <p className="text-caption uppercase text-muted-foreground tracking-widest">
                Archive Entry // New
              </p>
              <h1 className="mt-4 text-heading-sm md:text-heading font-light leading-heading tracking-[-0.023em]">
                Add a song.
              </h1>
            </div>

            <div className="border-l border-accent pl-6 py-2">
              <p className="text-body-sm leading-relaxed text-muted-foreground">
                Setiap bait kata diarsipkan dengan tata letak editorial poster.
                Lengkapi informasi utama, kredit personel komposer & produser, serta
                rekaman gambar untuk melengkapi lembar arsip.
              </p>
            </div>

            <div className="hidden lg:flex flex-col gap-3 pt-6 border-t border-border text-caption text-muted-foreground uppercase">
              <p>// Pedoman Kurasi</p>
              <ul className="space-y-2 text-muted-foreground/80 normal-case text-body-sm font-light">
                <li>• Pastikan ejaan judul dan nama artis akurat.</li>
                <li>• Pisahkan baris bait lirik dengan spasi baris ganda.</li>
                <li>• Gambar cover akan otomatis ditampilkan dalam rasio 1:1 persegi.</li>
              </ul>
            </div>
          </aside>

          {/* Kolom Kanan: Form Lengkap Terstruktur */}
          <div className="max-w-3xl">
            <AddSongForm error={error} />
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
