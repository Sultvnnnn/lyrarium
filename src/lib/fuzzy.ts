/**
 * Lyrarium Typo-Tolerant Trigram & Damerau-Levenshtein Fuzzy Engine
 * Zero dependencies, ultra-low latency (<1ms) candidate-pruned search.
 * Strictly compliant with DESIGN.md & AGENTS.md.
 */

export type FuzzyItemType = "song" | "artist";

export type FuzzyDictionaryItem = {
  id: string;
  text: string;
  type: FuzzyItemType;
  targetId: number | string;
  url: string;
  subtitle?: string;
  normalized: string;
  normalizedWithoutThe: string;
  noSpaces: string;
  tokens: string[];
  trigrams: Set<string>;
};

export type TrigramIndex = {
  items: FuzzyDictionaryItem[];
  invertedIndex: Map<string, number[]>;
};

export type FuzzySuggestion = {
  id: string;
  text: string;
  type: FuzzyItemType;
  targetId: number | string;
  url: string;
  subtitle?: string;
  score: number;
  highlightSegments: HighlightSegment[];
};

export type HighlightSegment = {
  text: string;
  isMatch: boolean;
};

export type FuzzySearchResult = {
  suggestions: FuzzySuggestion[];
  didYouMean: FuzzySuggestion | null;
};

/**
 * Normalisasi string: lowercase, trim, collapse whitespace, strip punctuation.
 */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Abaikan prefix "the " untuk scoring per AGENTS.md.
 */
export function stripThePrefix(str: string): string {
  return str.replace(/^the\s+/i, "").trim();
}

/**
 * Ekstraksi character trigrams dengan boundary markers.
 * Contoh "loser" -> ["  l", " lo", "los", "ose", "ser", "er "]
 */
export function getTrigrams(str: string): Set<string> {
  const trigrams = new Set<string>();
  const clean = str.trim();
  if (!clean) return trigrams;

  const padded = `  ${clean} `;
  for (let i = 0; i <= padded.length - 3; i++) {
    trigrams.add(padded.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Damerau-Levenshtein distance:
 * Menghitung jarak edit minimum (insertions, deletions, substitutions, dan
 * adjacent character transpositions).
 */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  if (a === b) return 0;

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
        d[i - 1][j - 1] + cost // substitution
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
 * Dynamic threshold:
 * Jarak maksimal = max(2, floor(len * 0.35)) supaya typo 4+ huruf masih match.
 */
export function getDynamicMaxDistance(queryLen: number, targetLen: number): number {
  const len = Math.max(queryLen, targetLen);
  return Math.max(2, Math.floor(len * 0.35));
}

/**
 * Bangun Trigram Index dari array item kamus (pre-computed via useMemo).
 */
export function buildTrigramIndex(
  items: Array<{
    id: string;
    text: string;
    type: FuzzyItemType;
    targetId: number | string;
    url: string;
    subtitle?: string;
  }>
): TrigramIndex {
  const dictionaryItems: FuzzyDictionaryItem[] = items.map((it) => {
    const norm = normalizeText(it.text);
    const normNoThe = stripThePrefix(norm);
    const tokens = norm.split(" ").filter((t) => t.length > 0);
    const noSpaces = norm.replace(/\s+/g, "");

    const trigrams = getTrigrams(norm);
    if (normNoThe !== norm) {
      const extra = getTrigrams(normNoThe);
      for (const t of extra) trigrams.add(t);
    }
    if (noSpaces !== norm) {
      const extraNoSpaces = getTrigrams(noSpaces);
      for (const t of extraNoSpaces) trigrams.add(t);
    }

    return {
      id: it.id,
      text: it.text,
      type: it.type,
      targetId: it.targetId,
      url: it.url,
      subtitle: it.subtitle,
      normalized: norm,
      normalizedWithoutThe: normNoThe,
      noSpaces,
      tokens,
      trigrams,
    };
  });

  const invertedIndex = new Map<string, number[]>();

  for (let i = 0; i < dictionaryItems.length; i++) {
    const item = dictionaryItems[i];
    for (const trigram of item.trigrams) {
      let postings = invertedIndex.get(trigram);
      if (!postings) {
        postings = [];
        invertedIndex.set(trigram, postings);
      }
      postings.push(i);
    }
  }

  return { items: dictionaryItems, invertedIndex };
}

/**
 * Pruning kandidat menggunakan inverted trigram index.
 * JANGAN scoring seluruh dictionary per keystroke — hanya scoring kandidat ter-prune.
 */
export function pruneCandidates(
  query: string,
  index: TrigramIndex,
  maxCandidates = 150
): Array<{ itemIndex: number; overlap: number }> {
  const normQ = normalizeText(query);
  if (normQ.length < 2) return [];

  const normQNoThe = stripThePrefix(normQ);
  const qTrigrams = getTrigrams(normQ);
  if (normQNoThe !== normQ) {
    const extra = getTrigrams(normQNoThe);
    for (const t of extra) qTrigrams.add(t);
  }
  const qNoSpaces = normQ.replace(/\s+/g, "");
  if (qNoSpaces !== normQ) {
    const extra = getTrigrams(qNoSpaces);
    for (const t of extra) qTrigrams.add(t);
  }

  if (qTrigrams.size === 0) return [];

  const hitCounts = new Int32Array(index.items.length);
  let hasMatches = false;

  for (const t of qTrigrams) {
    const postings = index.invertedIndex.get(t);
    if (postings) {
      for (let j = 0; j < postings.length; j++) {
        const idx = postings[j];
        hitCounts[idx]++;
        hasMatches = true;
      }
    }
  }

  // Also include exact substring matches if not caught by trigram (e.g. very short tokens)
  for (let i = 0; i < index.items.length; i++) {
    const item = index.items[i];
    if (
      hitCounts[i] === 0 &&
      (item.normalized.includes(normQ) || item.normalizedWithoutThe.includes(normQNoThe))
    ) {
      hitCounts[i] = 1;
      hasMatches = true;
    }
  }

  if (!hasMatches) return [];

  const candidates: Array<{ itemIndex: number; overlap: number }> = [];
  for (let i = 0; i < index.items.length; i++) {
    const count = hitCounts[i];
    if (count > 0) {
      candidates.push({ itemIndex: i, overlap: count });
    }
  }

  // Sort by overlap count desc and cap
  candidates.sort((a, b) => b.overlap - a.overlap);
  if (candidates.length > maxCandidates) {
    candidates.length = maxCandidates;
  }

  return candidates;
}

/**
 * Highlight generator: membagi teks menjadi segmen matched dan unmatched
 * untuk dirender dengan <mark className="bg-accent text-accent-foreground">.
 */
export function getHighlightSegments(text: string, query: string): HighlightSegment[] {
  if (!text) return [];
  const rawQ = query.trim();
  if (!rawQ) return [{ text, isMatch: false }];

  const lowerText = text.toLowerCase();
  const lowerQ = rawQ.toLowerCase();

  // 1. Exact substring match
  const subIdx = lowerText.indexOf(lowerQ);
  if (subIdx !== -1) {
    const segments: HighlightSegment[] = [];
    if (subIdx > 0) {
      segments.push({ text: text.substring(0, subIdx), isMatch: false });
    }
    segments.push({ text: text.substring(subIdx, subIdx + rawQ.length), isMatch: true });
    if (subIdx + rawQ.length < text.length) {
      segments.push({ text: text.substring(subIdx + rawQ.length), isMatch: false });
    }
    return segments;
  }

  // 2. Per-token matching (exact substring or fuzzy word alignment)
  const matchedChars = new Uint8Array(text.length);
  const qTokens = lowerQ.split(/\s+/).filter((t) => t.length > 0);

  // Find word boundaries in text
  const words: Array<{ word: string; start: number; end: number }> = [];
  const wordRegex = /[\p{L}\p{N}]+/gu;
  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(lowerText)) !== null) {
    words.push({ word: match[0], start: match.index, end: match.index + match[0].length });
  }

  for (const qToken of qTokens) {
    // A. Direct substring in text
    let foundPos = lowerText.indexOf(qToken);
    if (foundPos !== -1) {
      while (foundPos !== -1) {
        for (let i = 0; i < qToken.length; i++) {
          matchedChars[foundPos + i] = 1;
        }
        foundPos = lowerText.indexOf(qToken, foundPos + qToken.length);
      }
      continue;
    }

    // B. Match against individual words in text with fuzzy distance
    let bestWordMatch: { start: number; end: number; word: string } | null = null;
    let minDistance = 999;

    for (const w of words) {
      const dist = damerauLevenshtein(qToken, w.word);
      const maxAllowed = getDynamicMaxDistance(qToken.length, w.word.length);
      if (dist <= maxAllowed && dist < minDistance) {
        minDistance = dist;
        bestWordMatch = w;
      }
    }

    if (bestWordMatch) {
      // Mark aligned characters in bestWordMatch
      let wIdx = bestWordMatch.start;
      for (let qi = 0; qi < qToken.length && wIdx < bestWordMatch.end; qi++) {
        const charQ = qToken[qi];
        while (wIdx < bestWordMatch.end) {
          if (lowerText[wIdx] === charQ) {
            matchedChars[wIdx] = 1;
            wIdx++;
            break;
          }
          wIdx++;
        }
      }
    }
  }

  // 3. Fallback: Sequential character alignment if nothing matched yet
  let anyMatched = false;
  for (let i = 0; i < text.length; i++) {
    if (matchedChars[i] === 1) {
      anyMatched = true;
      break;
    }
  }

  if (!anyMatched) {
    let tIdx = 0;
    const cleanQ = normalizeText(rawQ).replace(/\s+/g, "");
    for (let qi = 0; qi < cleanQ.length && tIdx < text.length; qi++) {
      const ch = cleanQ[qi];
      while (tIdx < text.length) {
        if (lowerText[tIdx] === ch) {
          matchedChars[tIdx] = 1;
          anyMatched = true;
          tIdx++;
          break;
        }
        tIdx++;
      }
    }
  }

  if (!anyMatched) {
    return [{ text, isMatch: false }];
  }

  // Combine consecutive matched/unmatched characters into segments
  const segments: HighlightSegment[] = [];
  let currentMatch = matchedChars[0] === 1;
  let currentStr = text[0];

  for (let i = 1; i < text.length; i++) {
    const isM = matchedChars[i] === 1;
    if (isM === currentMatch) {
      currentStr += text[i];
    } else {
      segments.push({ text: currentStr, isMatch: currentMatch });
      currentMatch = isM;
      currentStr = text[i];
    }
  }
  segments.push({ text: currentStr, isMatch: currentMatch });

  return segments;
}

/**
 * Core search fuzzy function:
 * Layer matching berurutan: exact -> substring (prefix bonus) -> token fuzzy -> global fuzzy.
 */
export function searchFuzzySuggestions(
  query: string,
  index: TrigramIndex,
  options: {
    maxSuggestions?: number;
    didYouMeanThreshold?: number;
  } = {}
): FuzzySearchResult {
  const { maxSuggestions = 8, didYouMeanThreshold = 0.52 } = options;

  const rawTrimmed = query.trim();
  if (rawTrimmed.length < 2) {
    return { suggestions: [], didYouMean: null };
  }

  const normQ = normalizeText(rawTrimmed);
  const normQNoThe = stripThePrefix(normQ);
  const qNoSpaces = normQ.replace(/\s+/g, "");
  const qTokens = normQ.split(" ").filter((t) => t.length > 0);
  const qTrigrams = getTrigrams(normQ);

  // Prune candidates via inverted trigram index (top candidates only)
  const candidates = pruneCandidates(rawTrimmed, index, 150);
  if (candidates.length === 0) {
    return { suggestions: [], didYouMean: null };
  }

  const scored: Array<{
    item: FuzzyDictionaryItem;
    score: number;
    isExact: boolean;
  }> = [];

  for (let i = 0; i < candidates.length; i++) {
    const { itemIndex, overlap } = candidates[i];
    const item = index.items[itemIndex];

    const targetNorm = item.normalized;
    const targetNormNoThe = item.normalizedWithoutThe;
    const targetNoSpaces = item.noSpaces;

    let score = 0;
    let isExact = false;

    // Layer 1: Exact Match
    if (normQ === targetNorm || normQNoThe === targetNormNoThe) {
      score = 2.0;
      isExact = true;
    } else if (qNoSpaces === targetNoSpaces && qNoSpaces.length >= 3) {
      // Space-agnostic exact (e.g. "never ender" vs "neverender")
      score = 1.85;
      isExact = true;
    }

    // Layer 2: Substring & Prefix match
    if (!isExact) {
      const isPrefix =
        targetNorm.startsWith(normQ) ||
        (normQNoThe.length >= 3 && targetNormNoThe.startsWith(normQNoThe));

      const isWordPrefix = item.tokens.some((t) => t.startsWith(normQ));

      const isSub =
        targetNorm.includes(normQ) ||
        (normQNoThe.length >= 3 && targetNormNoThe.includes(normQNoThe));

      if (isPrefix) {
        // Prefix bonus
        score = Math.max(score, 1.2 + (normQ.length / targetNorm.length) * 0.4);
      } else if (isWordPrefix) {
        score = Math.max(score, 1.1 + (normQ.length / targetNorm.length) * 0.3);
      } else if (isSub) {
        score = Math.max(score, 0.85 + (normQ.length / targetNorm.length) * 0.25);
      }
    }

    // Layer 3: Token fuzzy matching (multi-word queries)
    if (!isExact && qTokens.length > 1) {
      let matchedTokens = 0;
      for (const qt of qTokens) {
        if (qt.length < 2) continue;
        const matched = item.tokens.some((it) => {
          if (it === qt || it.startsWith(qt)) return true;
          if (it.length >= 4 && qt.length >= 4) {
            return damerauLevenshtein(qt, it) <= 1;
          }
          return false;
        });
        if (matched) matchedTokens++;
      }

      if (matchedTokens === qTokens.length) {
        score = Math.max(score, 1.15);
      } else if (matchedTokens > 0) {
        score = Math.max(score, 0.7 + (matchedTokens / qTokens.length) * 0.3);
      }
    }

    // Layer 4: Global fuzzy via Trigram Similarity + Damerau-Levenshtein refinement
    const trigramSim = (2 * overlap) / (qTrigrams.size + item.trigrams.size);

    // Damerau-Levenshtein distance calculation
    const dist1 = damerauLevenshtein(normQ, targetNorm);
    const dist2 =
      normQNoThe !== normQ || targetNormNoThe !== targetNorm
        ? damerauLevenshtein(normQNoThe, targetNormNoThe)
        : dist1;
    const dist3 =
      qNoSpaces !== normQ || targetNoSpaces !== targetNorm
        ? damerauLevenshtein(qNoSpaces, targetNoSpaces)
        : dist1;

    let dist = Math.min(dist1, dist2, dist3);

    // Word-level distance (e.g. single-word query "rapsody" in "Bohemian Rhapsody")
    if (qTokens.length === 1 && item.tokens.length > 1) {
      for (const t of item.tokens) {
        const d = damerauLevenshtein(normQ, t);
        if (d < dist) dist = d;
      }
    }

    const maxLen = Math.max(normQ.length, targetNorm.length);
    const maxAllowedDist = getDynamicMaxDistance(normQ.length, targetNorm.length);

    if (dist <= maxAllowedDist) {
      const editSim = Math.max(0, 1 - dist / maxLen);
      // Komposisi: 0.4 trigram + 0.6 edit distance + prefix bonus
      const fuzzyScore = 0.4 * trigramSim + 0.6 * editSim;
      score = Math.max(score, fuzzyScore);
    } else if (trigramSim > 0.6) {
      // Fallback if trigrams strongly align even with higher edit distance
      score = Math.max(score, trigramSim * 0.75);
    }

    if (score >= 0.45) {
      scored.push({ item, score, isExact });
    }
  }

  // Sort desc by score
  scored.sort((a, b) => b.score - a.score);

  // Filter out identical query suggestions and dedupe by normalized text
  const seenTexts = new Set<string>();
  const suggestions: FuzzySuggestion[] = [];

  for (const entry of scored) {
    const textLower = entry.item.text.toLowerCase().trim();
    // Abaikan jika persis sama dengan query yang diketik
    if (textLower === rawTrimmed.toLowerCase()) continue;
    if (seenTexts.has(textLower)) continue;

    seenTexts.add(textLower);
    suggestions.push({
      id: entry.item.id,
      text: entry.item.text,
      type: entry.item.type,
      targetId: entry.item.targetId,
      url: entry.item.url,
      subtitle: entry.item.subtitle,
      score: entry.score,
      highlightSegments: getHighlightSegments(entry.item.text, rawTrimmed),
    });

    if (suggestions.length >= maxSuggestions) break;
  }

  // Tentukan "Did You Mean" jika ada kandidat kuat di atas threshold
  let didYouMean: FuzzySuggestion | null = null;
  if (suggestions.length > 0) {
    const top = suggestions[0];
    if (top.score >= didYouMeanThreshold) {
      didYouMean = top;
    }
  }

  return { suggestions, didYouMean };
}
