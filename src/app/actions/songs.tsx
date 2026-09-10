"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { songs, artists } from "@/db/schema";
import { uploadSongImage } from "@/lib/supabase-storage";

export async function addSong(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const artist = String(formData.get("artist") ?? "").trim();
  const lyrics = String(formData.get("lyrics") ?? "").trim();
  let aboutArtist = String(formData.get("aboutArtist") ?? "").trim() || null;

  if (!aboutArtist && artist) {
    const artistRecord = await db.query.artists.findFirst({
      where: eq(artists.name, artist),
    });
    if (artistRecord?.about) {
      aboutArtist = artistRecord.about;
    }
  }
  const creditsJson = String(formData.get("credits_json") ?? "").trim();
  const creditsRaw = String(formData.get("credits") ?? "").trim();
  const credits = creditsJson || creditsRaw || null;
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim() || null;

  if (!title || !artist || !lyrics) redirect("/add?error=1");

  // Handle image upload
  let imageUrl: string | null = null;
  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      redirect("/add?error=large");
    }
    imageUrl = await uploadSongImage(imageFile);
  }

  await db.insert(songs).values({
    title,
    artist,
    lyrics,
    imageUrl,
    aboutArtist,
    credits,
    youtubeUrl,
  });

  revalidatePath("/");
  redirect("/");
}
