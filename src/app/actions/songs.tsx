"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { songs, artists } from "@/db/schema";
import { uploadSongImage, deleteSongImage } from "@/lib/supabase-storage";

async function safeDeleteSongImage(urlToDelete: string | null) {
  if (!urlToDelete) return;
  try {
    const [songUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(songs)
      .where(eq(songs.imageUrl, urlToDelete));

    const [artistUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(artists)
      .where(eq(artists.imageUrl, urlToDelete));

    const totalUsage =
      Number(songUsage?.count ?? 0) + Number(artistUsage?.count ?? 0);

    // If totalUsage <= 1 (meaning either only the record being modified, or already 0),
    // it is safe to delete from storage. If totalUsage > 1, other tracks still share it.
    if (totalUsage <= 1) {
      await deleteSongImage(urlToDelete);
    }
  } catch (err) {
    console.error("Error in safeDeleteSongImage:", err);
  }
}

export async function addSong(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const artist = String(formData.get("artist") ?? "").trim();
  const album = String(formData.get("album") ?? "").trim() || null;
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

  // Handle image upload or reuse existing artwork
  let imageUrl: string | null = null;
  const existingImageUrl =
    String(formData.get("existingImageUrl") ?? "").trim() || null;
  const imageFile = formData.get("image") as File | null;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      redirect("/add?error=large");
    }
    imageUrl = await uploadSongImage(imageFile);
  } else if (existingImageUrl) {
    imageUrl = existingImageUrl;
  }

  await db.insert(songs).values({
    title,
    artist,
    album,
    featuring,
    lyrics,
    imageUrl,
    aboutArtist,
    credits,
    youtubeUrl,
  });

  revalidatePath("/");
  revalidatePath("/add");
  revalidatePath("/edit");
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
  const album = String(formData.get("album") ?? "").trim() || null;
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
  const existingImageUrl =
    String(formData.get("existingImageUrl") ?? "").trim() || null;

  if (!title || !artist || !lyrics) {
    redirect(`/lyrics/${id}/edit?error=1`);
  }

  // Fetch existing song record to get true previous imageUrl
  const existingSong = await db.query.songs.findFirst({
    where: eq(songs.id, id),
    columns: { imageUrl: true },
  });
  const previousImageUrl = existingSong?.imageUrl ?? currentImageUrl;

  // Handle image upload / existing reuse / removal
  let imageUrl: string | null = previousImageUrl;
  if (removeImage) {
    imageUrl = null;
    if (previousImageUrl) {
      await safeDeleteSongImage(previousImageUrl);
    }
  } else {
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
        redirect(`/lyrics/${id}/edit?error=large`);
      }
      const uploadedUrl = await uploadSongImage(imageFile);
      if (uploadedUrl) {
        if (previousImageUrl && previousImageUrl !== uploadedUrl) {
          await safeDeleteSongImage(previousImageUrl);
        }
        imageUrl = uploadedUrl;
      }
    } else if (existingImageUrl) {
      if (previousImageUrl && previousImageUrl !== existingImageUrl) {
        await safeDeleteSongImage(previousImageUrl);
      }
      imageUrl = existingImageUrl;
    }
  }

  await db
    .update(songs)
    .set({
      title,
      artist,
      album,
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
  revalidatePath("/edit");
  redirect(`/lyrics/${id}`);
}

