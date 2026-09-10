"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { artists } from "@/db/schema";

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
      })
      .onConflictDoUpdate({
        target: artists.name,
        set: { about },
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
