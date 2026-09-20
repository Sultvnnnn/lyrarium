/**
 * Lyrarium Editorial Search & Typo Engine
 * High-performance, zero-dependency fuzzy search & "Did you mean?" suggestion system.
 */

export type SearchableSong = {
  id: number;
  title: string;
  artist: string;
  album?: string | null;
  featuring?: string | null;
  lyrics: string;
  imageUrl?: string | null;
  createdAt?: Date | null;
  [key: string]: any;
};

export type SearchableArtist = {
  name: string;
  slug: string;
  about?: string | null;
  imageUrl?: string | null;
  songCount?: number;
  [key: string]: any;
};

export type SuggestionType = "artist" | "song" | "lyric";

export type DidYouMeanSuggestion = {
  originalQuery: string;
  suggestedText: string;
  type: SuggestionType;
  title: string;
  subtitle?: string;
  url: string;
  confidence: number;
};

export type MatchedSong<T extends SearchableSong = SearchableSong> = T & {
  matchedLyric?: string | null;
  score?: number;
};

export type MatchedArtist<T extends SearchableArtist = SearchableArtist> = T & {
  score?: number;
};

export type SearchEngineResult<
  TSong extends SearchableSong = SearchableSong,
  TArtist extends SearchableArtist = SearchableArtist,
> = {
  query: string;
  hasExactMatches: boolean;
  suggestion: DidYouMeanSuggestion | null;
  exactMatches: {
    songs: MatchedSong<TSong>[];
    artists: MatchedArtist<TArtist>[];
    total: number;
  };
  fuzzyMatches: {
    songs: MatchedSong<TSong>[];
    artists: MatchedArtist<TArtist>[];
    total: number;
  };
};

/**
 * Damerau-Levenshtein distance:
 * Calculates minimum edit distance allowing insertions, deletions, substitutions,
 * and adjacent character transpositions.
 */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  // Matrix allocation
  const d: number[][] = [];
  for (let i = 0; i <= al; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost, // substitution
      );

      // Transposition
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[al][bl];
}

/**
 * Normalized similarity score between 0.0 (completely distinct) and 1.0 (identical).
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = damerauLevenshtein(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Clean & normalize a query or target string.
 */
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u00C0-\u024F]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Extract the first matching lyric line for exact substring search.
 */
export function getMatchingLyricLine(lyrics: string, query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return null;

  const lines = lyrics.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "");
    if (line.length > 0 && !line.startsWith("[") && line.toLowerCase().includes(q)) {
      return line;
    }
  }
  return null;
}

/**
 * Extract best fuzzy-matching lyric line when user has a typo.
 */
export function getFuzzyLyricLine(lyrics: string, query: string): { line: string; score: number } | null {
  const normQ = normalize(query);
  if (!normQ || normQ.length < 3) return null;
  const qWords = normQ.split(" ").filter((w) => w.length > 1);
  if (qWords.length === 0) return null;

  const lines = lyrics.split("\n");
  let bestLine: string | null = null;
  let bestScore = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "");
    if (!line || line.startsWith("[")) continue;

    const normLine = normalize(line);
    const lineWords = normLine.split(" ").filter((w) => w.length > 1);
    if (lineWords.length === 0) continue;

    // Check if query is close to line substring
    if (normLine.includes(normQ)) {
      return { line, score: 1.0 };
    }

    // Word-by-word fuzzy comparison
    let matchedWordCount = 0;
    let scoreSum = 0;

    for (const qw of qWords) {
      let maxWordSim = 0;
      for (const lw of lineWords) {
        if (Math.abs(qw.length - lw.length) > 3) continue;
        const sim = stringSimilarity(qw, lw);
        if (sim > maxWordSim) {
          maxWordSim = sim;
        }
      }

      if (maxWordSim >= 0.7) {
        matchedWordCount++;
        scoreSum += maxWordSim;
      }
    }

    if (matchedWordCount === qWords.length) {
      const avgScore = scoreSum / qWords.length;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestLine = line;
      }
    }
  }

  if (bestLine && bestScore >= 0.72) {
    return { line: bestLine, score: bestScore };
  }

  return null;
}

/**
 * Score how well a target string matches a query using hybrid token & edit distance.
 */
function scoreMatch(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);

  if (t === q) return 1.0;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.9;

  // Single word query vs single/multi-word target
  const qWords = q.split(" ").filter((w) => w.length > 0);
  const tWords = t.split(" ").filter((w) => w.length > 0);

  if (qWords.length === 1) {
    const word = qWords[0];
    let maxWordScore = 0;

    for (const tw of tWords) {
      if (tw === word) return 0.95;
      if (tw.startsWith(word) && word.length >= 3) {
        maxWordScore = Math.max(maxWordScore, 0.85);
      }
      if (Math.abs(word.length - tw.length) <= 3) {
        const sim = stringSimilarity(word, tw);
        if (sim > maxWordScore) {
          maxWordScore = sim;
        }
      }
    }

    // Direct whole similarity
    const wholeSim = stringSimilarity(q, t);
    return Math.max(maxWordScore, wholeSim);
  }

  // Multi-word query
  let matchedWords = 0;
  let wordScoreSum = 0;

  for (const qw of qWords) {
    let bestForQw = 0;
    for (const tw of tWords) {
      if (qw === tw) {
        bestForQw = 1.0;
        break;
      }
      if (Math.abs(qw.length - tw.length) <= 3) {
        const sim = stringSimilarity(qw, tw);
        if (sim > bestForQw) bestForQw = sim;
      }
    }

    if (bestForQw >= 0.7) {
      matchedWords++;
      wordScoreSum += bestForQw;
    }
  }

  const coverage = matchedWords / qWords.length;
  if (coverage >= 0.75) {
    const penalty = coverage === 1.0 ? 1.0 : 0.85;
    return (wordScoreSum / qWords.length) * penalty;
  }

  return stringSimilarity(q, t);
}

/**
 * Main Search and Typo Suggestion function.
 */
export function searchFuzzy<
  TSong extends SearchableSong = SearchableSong,
  TArtist extends SearchableArtist = SearchableArtist,
>(
  query: string,
  searchableSongs: TSong[] = [],
  searchableArtists: TArtist[] = [],
): SearchEngineResult<TSong, TArtist> {
  const cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();
  const normQuery = normalize(cleanQuery);

  if (!cleanQuery) {
    return {
      query: cleanQuery,
      hasExactMatches: false,
      suggestion: null,
      exactMatches: { songs: [], artists: [], total: 0 },
      fuzzyMatches: { songs: [], artists: [], total: 0 },
    };
  }

  // ── 1. EXACT SUBSTRING MATCHES ──
  const exactSongs: MatchedSong<TSong>[] = [];
  for (const s of searchableSongs) {
    const titleLower = s.title.toLowerCase();
    const artistLower = s.artist.toLowerCase();
    const featLower = s.featuring ? s.featuring.toLowerCase() : "";
    const albumLower = s.album ? s.album.toLowerCase() : "";
    const lyricsLower = s.lyrics.toLowerCase();

    const isTitleMatch = titleLower.includes(lowerQuery);
    const isArtistMatch = artistLower.includes(lowerQuery);
    const isFeatMatch = featLower.includes(lowerQuery);
    const isAlbumMatch = albumLower.includes(lowerQuery);
    const isLyricsMatch = lyricsLower.includes(lowerQuery);

    if (isTitleMatch || isArtistMatch || isFeatMatch || isAlbumMatch || isLyricsMatch) {
      let matchedLyric: string | null = null;
      if (!isTitleMatch && !isArtistMatch && isLyricsMatch) {
        matchedLyric = getMatchingLyricLine(s.lyrics, lowerQuery);
      } else if (isLyricsMatch && lowerQuery.length >= 3) {
        matchedLyric = getMatchingLyricLine(s.lyrics, lowerQuery);
      }

      exactSongs.push({
        ...s,
        matchedLyric,
        score: isTitleMatch ? 1.0 : isArtistMatch ? 0.95 : 0.85,
      });

      if (exactSongs.length >= 50) break;
    }
  }

  const exactArtists: MatchedArtist<TArtist>[] = [];
  for (const a of searchableArtists) {
    const nameLower = a.name.toLowerCase();
    const aboutLower = a.about ? a.about.toLowerCase() : "";

    if (nameLower.includes(lowerQuery) || aboutLower.includes(lowerQuery)) {
      exactArtists.push({
        ...a,
        score: nameLower === lowerQuery ? 1.0 : 0.9,
      });
      if (exactArtists.length >= 5) break;
    }
  }

  const hasExactMatches = exactSongs.length > 0 || exactArtists.length > 0;

  // ── 2. "DID YOU MEAN?" TYPO ENGINE ──
  // Compute possible candidate suggestions across artists, titles, and lyrics
  let bestSuggestion: DidYouMeanSuggestion | null = null;
  let highestSuggestionScore = 0;

  // Only suggest if query has at least 3 characters
  if (normQuery.length >= 3) {
    // Check against Artists
    for (const a of searchableArtists) {
      const aNorm = normalize(a.name);
      if (aNorm === normQuery) continue; // identical, not a typo

      const score = scoreMatch(normQuery, aNorm);
      if (score >= 0.72 && score > highestSuggestionScore) {
        highestSuggestionScore = score;
        bestSuggestion = {
          originalQuery: cleanQuery,
          suggestedText: a.name,
          type: "artist",
          title: a.name,
          subtitle: "Artist",
          url: `/artist/${a.slug}`,
          confidence: score,
        };
      }
    }

    // Check against Song Titles
    for (const s of searchableSongs) {
      const tNorm = normalize(s.title);
      if (tNorm === normQuery) continue;

      const score = scoreMatch(normQuery, tNorm);
      if (score >= 0.72 && score > highestSuggestionScore) {
        highestSuggestionScore = score;
        bestSuggestion = {
          originalQuery: cleanQuery,
          suggestedText: s.title,
          type: "song",
          title: s.title,
          subtitle: s.artist,
          url: `/lyrics/${s.id}`,
          confidence: score,
        };
      }

      // Check against Artist + Title combination
      const combo = normalize(`${s.artist} ${s.title}`);
      const comboScore = scoreMatch(normQuery, combo);
      if (comboScore >= 0.75 && comboScore > highestSuggestionScore) {
        highestSuggestionScore = comboScore;
        bestSuggestion = {
          originalQuery: cleanQuery,
          suggestedText: `${s.artist} - ${s.title}`,
          type: "song",
          title: s.title,
          subtitle: s.artist,
          url: `/lyrics/${s.id}`,
          confidence: comboScore,
        };
      }
    }

    // Check against Lyric lines if no high-confidence artist/title match
    if (highestSuggestionScore < 0.88 && searchableSongs.length > 0) {
      for (const s of searchableSongs) {
        const fuzzyLyric = getFuzzyLyricLine(s.lyrics, normQuery);
        if (fuzzyLyric && fuzzyLyric.score > highestSuggestionScore) {
          highestSuggestionScore = fuzzyLyric.score;
          bestSuggestion = {
            originalQuery: cleanQuery,
            suggestedText: fuzzyLyric.line,
            type: "lyric",
            title: fuzzyLyric.line,
            subtitle: `${s.title} — ${s.artist}`,
            url: `/lyrics/${s.id}`,
            confidence: fuzzyLyric.score,
          };
          break;
        }
      }
    }
  }

  // ── 3. FUZZY SEARCH MATCHES (Used when exact matches are 0 or for discovery) ──
  const fuzzySongs: MatchedSong<TSong>[] = [];
  const fuzzyArtists: MatchedArtist<TArtist>[] = [];

  if (normQuery.length >= 3) {
    // Fuzzy Artists
    for (const a of searchableArtists) {
      if (exactArtists.some((ea) => ea.slug === a.slug)) continue;
      const score = scoreMatch(normQuery, a.name);
      if (score >= 0.7) {
        fuzzyArtists.push({
          ...a,
          score,
        });
      }
    }
    fuzzyArtists.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    // Fuzzy Songs
    for (const s of searchableSongs) {
      if (exactSongs.some((es) => es.id === s.id)) continue;

      const titleScore = scoreMatch(normQuery, s.title);
      const artistScore = scoreMatch(normQuery, s.artist);
      const featScore = s.featuring ? scoreMatch(normQuery, s.featuring) : 0;
      const albumScore = s.album ? scoreMatch(normQuery, s.album) : 0;

      let matchedLyric: string | null = null;
      let lyricScore = 0;

      if (titleScore < 0.7 && artistScore < 0.7) {
        const fl = getFuzzyLyricLine(s.lyrics, normQuery);
        if (fl) {
          matchedLyric = fl.line;
          lyricScore = fl.score;
        }
      }

      const maxScore = Math.max(titleScore, artistScore, featScore, albumScore, lyricScore);
      if (maxScore >= 0.68) {
        fuzzySongs.push({
          ...s,
          matchedLyric,
          score: maxScore,
        });
      }

      if (fuzzySongs.length >= 30) break;
    }
    fuzzySongs.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  return {
    query: cleanQuery,
    hasExactMatches,
    suggestion: bestSuggestion,
    exactMatches: {
      songs: exactSongs,
      artists: exactArtists,
      total: exactSongs.length + exactArtists.length,
    },
    fuzzyMatches: {
      songs: fuzzySongs,
      artists: fuzzyArtists,
      total: fuzzySongs.length + fuzzyArtists.length,
    },
  };
}
