"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { uploadSongImage } from "@/lib/supabase-storage";

export async function addSong(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const artist = String(formData.get("artist") ?? "").trim();
  const lyrics = String(formData.get("lyrics") ?? "").trim();
  const aboutArtist = String(formData.get("aboutArtist") ?? "").trim() || null;
  const credits = String(formData.get("credits") ?? "").trim() || null;
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
