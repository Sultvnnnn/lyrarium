export type StructuredCredit = {
  role: string;
  names: string[];
};

/**
 * Parsing data kredit lagu, mendukung format JSON baru maupun format teks lama (Key: Value).
 */
export function parseCredits(raw: string | null | undefined): StructuredCredit[] {
  if (!raw || !raw.trim()) return [];

  const trimmed = raw.trim();

  // 1. Coba parse sebagai format JSON terstruktur
  try {
    const parsed = JSON.parse(trimmed);

    // Format array: [{ role: "Writer", names: ["..."] }]
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item) =>
            item &&
            typeof item.role === "string" &&
            Array.isArray(item.names) &&
            item.names.length > 0
        )
        .map((item) => ({
          role: item.role.trim(),
          names: item.names.map((n: string) => String(n).trim()).filter(Boolean),
        }));
    }

    // Format objek: { "Writers": ["..."], "Producers": ["..."] }
    if (typeof parsed === "object") {
      const result: StructuredCredit[] = [];
      for (const [role, val] of Object.entries(parsed)) {
        if (!val) continue;
        const names = Array.isArray(val)
          ? val.map((n) => String(n).trim()).filter(Boolean)
          : String(val)
              .split(",")
              .map((n) => n.trim())
              .filter(Boolean);

        if (names.length > 0) {
          result.push({ role: role.trim(), names });
        }
      }
      return result;
    }
  } catch {
    // Bukan JSON, lanjutkan ke parsing format teks lama
  }

  // 2. Format teks lama: "Role: Name 1, Name 2" per baris
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: StructuredCredit[] = [];

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const role = line.slice(0, colonIdx).trim();
      const namesStr = line.slice(colonIdx + 1).trim();
      const names = namesStr
        .split(/,\s*|\s*;\s*/)
        .map((n) => n.trim())
        .filter(Boolean);

      if (role && names.length > 0) {
        result.push({ role, names });
      }
    } else {
      // Baris teks bebas tanpa format Role: Name
      result.push({ role: "Credits", names: [line] });
    }
  }

  return result;
}

/**
 * Menyimpan data kredit ke format JSON string yang ringkas dan aman.
 */
export function serializeCredits(credits: StructuredCredit[]): string | null {
  const filtered = credits
    .filter(
      (c) =>
        c.role.trim().length > 0 &&
        c.names.some((n) => n.trim().length > 0)
    )
    .map((c) => ({
      role: c.role.trim(),
      names: c.names.map((n) => n.trim()).filter(Boolean),
    }));

  if (filtered.length === 0) return null;
  return JSON.stringify(filtered);
}
