export type YouTubeVideo = {
  title: string;
  url: string;
};

/**
 * Extracts the YouTube Video ID from various URL formats
 * (standard watch, youtu.be, embed, shorts, live).
 */
export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  try {
    const trimmed = url.trim();
    // Handle bare ID if user accidentally pastes only the ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    let id: string | null = null;

    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1).split("/")[0]?.split("?")[0] || null;
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") {
        id = u.searchParams.get("v");
      } else if (u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/")[2]?.split("?")[0] || null;
      } else if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/")[2]?.split("?")[0] || null;
      } else if (u.pathname.startsWith("/live/")) {
        id = u.pathname.split("/")[2]?.split("?")[0] || null;
      }
    }
    return id || null;
  } catch {
    return null;
  }
}

/**
 * Parses raw database youtube_url content.
 * Supports both modern structured JSON arrays and legacy plain URL strings.
 */
export function parseYouTubeVideos(raw: string | null | undefined): YouTubeVideo[] {
  if (!raw || !raw.trim()) return [];
  const trimmed = raw.trim();

  // 1. Attempt parsing as JSON array
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const valid = parsed
        .filter(
          (item): item is { title?: unknown; url?: unknown } =>
            item !== null &&
            typeof item === "object" &&
            typeof item.url === "string" &&
            item.url.trim().length > 0
        )
        .map((item, idx) => ({
          title:
            typeof item.title === "string" && item.title.trim()
              ? item.title.trim()
              : idx === 0
              ? "Music Video"
              : `Video ${idx + 1}`,
          url: (item.url as string).trim(),
        }));

      if (valid.length > 0) return valid;
    }
  } catch {
    // Not valid JSON, proceed to raw URL parsing
  }

  // 2. Legacy fallback: Single URL or newline-delimited URLs
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: YouTubeVideo[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (extractYouTubeVideoId(line)) {
      result.push({
        title: i === 0 ? "Music Video" : `Video ${i + 1}`,
        url: line,
      });
    }
  }

  return result;
}

/**
 * Serializes an array of YouTube videos into a compact JSON string.
 * Returns null if no valid URLs exist.
 */
export function serializeYouTubeVideos(videos: YouTubeVideo[]): string | null {
  const filtered = videos
    .map((v, idx) => ({
      title: idx === 0 ? "Music Video" : (v.title.trim() || `Video ${idx + 1}`),
      url: v.url.trim(),
    }))
    .filter((v) => extractYouTubeVideoId(v.url) !== null);

  if (filtered.length === 0) return null;
  return JSON.stringify(filtered);
}
