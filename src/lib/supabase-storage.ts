import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseStorage = createClient(supabaseUrl, supabaseKey);

export async function uploadSongImage(file: File): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 24);
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${hash}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabaseStorage.storage
      .from("song-images")
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabaseStorage.storage.from("song-images").getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
}

export const uploadArtistImage = uploadSongImage;

export function extractStoragePath(url: string, bucket = "song-images"): string | null {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return url.slice(idx + marker.length).split("?")[0];
  }
  // If the string is already just the file path
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }
  return null;
}

export async function deleteSongImage(
  url: string | null | undefined,
  bucket = "song-images"
): Promise<void> {
  if (!url) return;
  try {
    const path = extractStoragePath(url, bucket);
    if (!path) return;
    const { error } = await supabaseStorage.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`Failed to delete storage file "${path}" from "${bucket}":`, error);
    }
  } catch (error) {
    console.error(`Error deleting storage file from "${bucket}":`, error);
  }
}

export const deleteArtistImage = deleteSongImage;


