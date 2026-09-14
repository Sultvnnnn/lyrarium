"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, songs } from "@/db/schema";

import { uploadArtistImage, deleteArtistImage } from "@/lib/supabase-storage";

export async function addArtist(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim() || null;
  const returnUrl = String(formData.get("returnUrl") ?? "").trim();

  if (!name) {
    const errorUrl = returnUrl
      ? `/artist/add?error=1&returnUrl=${encodeURIComponent(returnUrl)}`
      : `/artist/add?error=1`;
    redirect(errorUrl);
  }

  // Handle image upload
  let imageUrl: string | null = null;
  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      const errorUrl = returnUrl
        ? `/artist/add?error=large&returnUrl=${encodeURIComponent(returnUrl)}`
        : `/artist/add?error=large`;
      redirect(errorUrl);
    }
    imageUrl = await uploadArtistImage(imageFile);
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    await db
      .insert(artists)
      .values({
        name,
        slug,
        about,
        imageUrl,
      })
      .onConflictDoUpdate({
        target: artists.name,
        set: {
          about,
          ...(imageUrl ? { imageUrl } : {}),
        },
      });
  } catch (e) {
    console.error("Failed to insert artist:", e);
  }

  revalidatePath("/");
  revalidatePath("/add");
  revalidatePath(`/artist/${slug}`);

  if (returnUrl) {
    // Jika ada returnUrl (misal dari halaman /add), kembali ke sana dengan query artist yang terpilih
    const separator = returnUrl.includes("?") ? "&" : "?";
    redirect(`${returnUrl}${separator}artist=${encodeURIComponent(name)}`);
  } else {
    redirect(`/artist/${slug}`);
  }
}

export async function updateArtist(
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

  const oldSlug = String(formData.get("oldSlug") ?? "").trim();
  const oldName = String(formData.get("oldName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim() || null;
  const removeImage = String(formData.get("removeImage") ?? "") === "true";
  const currentImageUrl =
    String(formData.get("currentImageUrl") ?? "").trim() || null;

  if (!id || isNaN(id)) {
    redirect("/edit?type=artists");
  }

  if (!name) {
    redirect(`/artist/${oldSlug || id}/edit?error=1`);
  }

  const newSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Fetch existing artist record to get true previous imageUrl
  const existingArtist = await db.query.artists.findFirst({
    where: eq(artists.id, id),
    columns: { imageUrl: true },
  });
  const previousImageUrl = existingArtist?.imageUrl ?? currentImageUrl;

  let imageUrl: string | null = previousImageUrl;
  if (removeImage) {
    imageUrl = null;
    if (previousImageUrl) {
      await deleteArtistImage(previousImageUrl);
    }
  }

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      redirect(`/artist/${oldSlug || id}/edit?error=large`);
    }
    const uploadedUrl = await uploadArtistImage(imageFile);
    if (uploadedUrl) {
      if (previousImageUrl && previousImageUrl !== uploadedUrl) {
        await deleteArtistImage(previousImageUrl);
      }
      imageUrl = uploadedUrl;
    }
  }

  await db
    .update(artists)
    .set({
      name,
      slug: newSlug,
      about,
      imageUrl,
    })
    .where(eq(artists.id, id));

  // If the artist name changed, update the artist in songs table as well
  if (oldName && oldName !== name) {
    await db
      .update(songs)
      .set({ artist: name })
      .where(eq(songs.artist, oldName));
  }

  revalidatePath("/");
  revalidatePath("/edit");
  revalidatePath("/add");
  if (oldSlug) revalidatePath(`/artist/${oldSlug}`);
  revalidatePath(`/artist/${newSlug}`);

  redirect(`/artist/${newSlug}`);
}

