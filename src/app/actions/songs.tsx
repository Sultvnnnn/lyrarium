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
  const featuring = String(formData.get("featuring") ?? "").trim() || null;
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
    featuring,
    lyrics,
    imageUrl,
    aboutArtist,
    credits,
    youtubeUrl,
  });

  revalidatePath("/");
  revalidatePath("/add");
  redirect("/");
}

export async function updateSong(
  idOrFormData: number | FormData,
  maybeFormData?: FormData
) {
  let id: number;
  let formData: FormData;

  if (typeof idOrFormData === "number") {
    id = idOrFormData;
    formData = maybeFormData as FormData;
  } else {
    formData = idOrFormData;
    id = Number(formData.get("id"));
  }

  if (!id || isNaN(id)) {
    redirect("/");
  }

  const title = String(formData.get("title") ?? "").trim();
  const artist = String(formData.get("artist") ?? "").trim();
  const featuring = String(formData.get("featuring") ?? "").trim() || null;
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
  const removeImage = String(formData.get("removeImage") ?? "") === "true";
  const currentImageUrl =
    String(formData.get("currentImageUrl") ?? "").trim() || null;

  if (!title || !artist || !lyrics) {
    redirect(`/lyrics/${id}/edit?error=1`);
  }

  // Handle image upload / removal
  let imageUrl: string | null = currentImageUrl;
  if (removeImage) {
    imageUrl = null;
  }

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      redirect(`/lyrics/${id}/edit?error=large`);
    }
    imageUrl = await uploadSongImage(imageFile);
  }

  await db
    .update(songs)
    .set({
      title,
      artist,
      featuring,
      lyrics,
      imageUrl,
      aboutArtist,
      credits,
      youtubeUrl,
    })
    .where(eq(songs.id, id));

  revalidatePath("/");
  revalidatePath(`/lyrics/${id}`);
  revalidatePath(`/lyrics/${id}/edit`);
  revalidatePath("/add");
  redirect(`/lyrics/${id}`);
}

