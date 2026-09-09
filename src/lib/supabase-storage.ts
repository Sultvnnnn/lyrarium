import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseStorage = createClient(supabaseUrl, supabaseKey);

export async function uploadSongImage(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabaseStorage.storage
      .from("song-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
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
