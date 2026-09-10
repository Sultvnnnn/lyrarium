"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { artists } from "@/db/schema";

import { uploadArtistImage } from "@/lib/supabase-storage";

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
