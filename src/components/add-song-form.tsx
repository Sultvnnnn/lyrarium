"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, X, Upload, ArrowRight, Music, Disc, Check, UserPlus, ChevronDown } from "lucide-react";
import { addSong } from "@/app/actions/songs";
import { serializeCredits, type StructuredCredit } from "@/lib/credits";

type CustomCreditRow = {
  id: string;
  role: string;
  names: string;
};

const inputCls =
  "w-full border border-border bg-transparent px-4 py-3 text-body font-light text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";

export function AddSongForm({
  error,
  artistsList = [],
  initialArtist = "",
  target = "",
}: {
  error?: string;
  artistsList?: string[];
  initialArtist?: string;
  target?: string;
}) {
  const [isPending, startTransition] = useTransition();

  // Field states
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState(initialArtist || (artistsList[0] ?? ""));
  const [artistSearch, setArtistSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lyrics, setLyrics] = useState("");

  // Featuring artists state
  const [featuringList, setFeaturingList] = useState<string[]>([]);
  const [featSearch, setFeatSearch] = useState("");
  const [featDropdownOpen, setFeatDropdownOpen] = useState(false);

  // Restore draft from sessionStorage on initial mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("lyrarium_add_song_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title) setTitle(draft.title);
        if (draft.artist && !initialArtist) setArtist(draft.artist);
        if (Array.isArray(draft.featuringList) && draft.featuringList.length > 0) {
          setFeaturingList((prev) => Array.from(new Set([...prev, ...draft.featuringList])));
        }
        if (draft.lyrics) setLyrics(draft.lyrics);
        if (draft.writers) setWriters(draft.writers);
        if (draft.producers) setProducers(draft.producers);
        if (draft.engineering) setEngineering(draft.engineering);
        if (Array.isArray(draft.customCredits) && draft.customCredits.length > 0) {
          setCustomCredits(draft.customCredits);
        }
      }
    } catch {
      // ignore
    }
  }, [initialArtist]);

  // Synchronize when initialArtist / target changes (e.g. redirected from Add Artist)
  useEffect(() => {
    if (initialArtist) {
      if (target === "feat") {
        setFeaturingList((prev) =>
          prev.includes(initialArtist) ? prev : [...prev, initialArtist]
        );
      } else {
        setArtist(initialArtist);
      }
    }
  }, [initialArtist, target]);

  // Standard Credits
  const [writers, setWriters] = useState("");
  const [producers, setProducers] = useState("");
  const [engineering, setEngineering] = useState("");

  // Custom Credits
  const [customCredits, setCustomCredits] = useState<CustomCreditRow[]>([]);

  // Image preview state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const featDropdownRef = useRef<HTMLDivElement>(null);
  const mainArtistDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        featDropdownRef.current &&
        !featDropdownRef.current.contains(e.target as Node)
      ) {
        setFeatDropdownOpen(false);
      }
      if (
        mainArtistDropdownRef.current &&
        !mainArtistDropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save draft to sessionStorage whenever fields change
  useEffect(() => {
    try {
      const draft = {
        title,
        artist,
        featuringList,
        lyrics,
        writers,
        producers,
        engineering,
        customCredits,
      };
      if (title || lyrics || featuringList.length > 0 || writers || producers) {
        sessionStorage.setItem("lyrarium_add_song_draft", JSON.stringify(draft));
      }
    } catch {
      // ignore
    }
  }, [title, artist, featuringList, lyrics, writers, producers, engineering, customCredits]);

  // Lyrics statistics
  const lineCount = lyrics.split("\n").filter((l) => l.trim().length > 0).length;
  const wordCount = lyrics.split(/\s+/).filter(Boolean).length;

  const filteredArtists = artistsList.filter((a) =>
    a.toLowerCase().includes(artistSearch.toLowerCase().trim())
  );

  const availableFeaturingArtists = artistsList
    .filter((a) => a !== artist && !featuringList.includes(a))
    .filter((a) => a.toLowerCase().includes(featSearch.toLowerCase().trim()));

  const addFeaturingArtist = (name: string) => {
    if (!featuringList.includes(name)) {
      setFeaturingList((prev) => [...prev, name]);
    }
    setFeatDropdownOpen(false);
    setFeatSearch("");
  };

  const removeFeaturingArtist = (name: string) => {
    setFeaturingList((prev) => prev.filter((item) => item !== name));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addCustomCreditRow = () => {
    setCustomCredits((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 9), role: "", names: "" },
    ]);
  };

  const removeCustomCreditRow = (id: string) => {
    setCustomCredits((prev) => prev.filter((row) => row.id !== id));
  };

  const updateCustomCreditRow = (
    id: string,
    field: "role" | "names",
    value: string
  ) => {
    setCustomCredits((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = (formData: FormData) => {
    try {
      sessionStorage.removeItem("lyrarium_add_song_draft");
    } catch {
      // ignore
    }

    formData.set("artist", artist);
    formData.set("featuring", featuringList.join(", "));

    const creditsList: StructuredCredit[] = [];

    // Main Artist
    if (artist.trim()) {
      creditsList.push({
        role: "Main Artist",
        names: [artist.trim()],
      });
    }

    // Featuring Artists
    if (featuringList.length > 0) {
      creditsList.push({
        role: "Featuring",
        names: featuringList,
      });
    }

    if (writers.trim()) {
      creditsList.push({
        role: "Songwriter",
        names: writers.split(/,\s*/).map((s) => s.trim()).filter(Boolean),
      });
    }

    if (producers.trim()) {
      creditsList.push({
        role: "Producer",
        names: producers.split(/,\s*/).map((s) => s.trim()).filter(Boolean),
      });
    }

    if (engineering.trim()) {
      creditsList.push({
        role: "Mixing & Mastering",
        names: engineering.split(/,\s*/).map((s) => s.trim()).filter(Boolean),
      });
    }

    // Custom roles
    for (const row of customCredits) {
      if (row.role.trim() && row.names.trim()) {
        creditsList.push({
          role: row.role.trim(),
          names: row.names.split(/,\s*/).map((s) => s.trim()).filter(Boolean),
        });
      }
    }

    const json = serializeCredits(creditsList);
    if (json) {
      formData.set("credits_json", json);
    }

    startTransition(async () => {
      await addSong(formData);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-16">
      {error && (
        <div className="border border-accent bg-accent/10 p-4">
          <p className="text-caption uppercase text-accent font-normal">
            {error === "large"
              ? "Image file is too large (maximum 5MB)."
              : "All required fields (Title, Artist, and Lyrics) must be completed."}
          </p>
        </div>
      )}

      {/* SECTION 1: THE ESSENTIALS */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            01 // The Essentials
          </p>
          <span className="text-caption uppercase text-accent font-normal">
            * Required
          </span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="title"
            className="text-caption uppercase text-muted-foreground"
          >
            Song Title <span className="text-accent">*</span>
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputCls}
            placeholder="e.g. Bohemian Rhapsody"
          />
        </div>

        {/* Main Artist Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="artist-select"
              className="text-caption uppercase text-muted-foreground"
            >
              Main Artist <span className="text-accent">*</span>
            </label>
            <Link
              href="/artist/add?returnUrl=/add"
              className="inline-flex items-center gap-1.5 text-caption uppercase text-muted-foreground hover:text-accent transition-colors"
            >
              <UserPlus size={16} strokeWidth={1} />
              <span>Add New Artist</span>
            </Link>
          </div>

          <input type="hidden" name="artist" value={artist} />

          {/* Artist Selector Component */}
          <div className="relative" ref={mainArtistDropdownRef}>
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center justify-between cursor-pointer border ${
                dropdownOpen ? "border-accent" : "border-border"
              } bg-transparent px-4 py-3 text-body font-light text-foreground transition-colors`}
            >
              <span className={artist ? "text-foreground" : "text-muted-foreground"}>
                {artist || "Select an artist..."}
              </span>
              <ChevronDown
                size={16}
                strokeWidth={1}
                className={`text-muted-foreground transition-transform ${
                  dropdownOpen ? "rotate-180 text-accent" : ""
                }`}
              />
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 border border-border bg-background shadow-none">
                {/* Search filter inside dropdown */}
                <div className="border-b border-border p-2">
                  <input
                    type="text"
                    value={artistSearch}
                    onChange={(e) => setArtistSearch(e.target.value)}
                    placeholder="Search artist..."
                    autoFocus
                    className="w-full border border-border/80 bg-muted/30 px-3 py-2 text-body-sm font-light text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Artists list */}
                <div className="max-h-56 overflow-y-auto divide-y divide-border/40">
                  {filteredArtists.length > 0 ? (
                    filteredArtists.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setArtist(a);
                          setDropdownOpen(false);
                          setArtistSearch("");
                        }}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-body-sm transition-colors hover:bg-muted/40 hover:text-accent ${
                          artist === a ? "text-accent bg-muted/20" : "text-foreground"
                        }`}
                      >
                        <span>{a}</span>
                        {artist === a && <Check size={16} strokeWidth={1} />}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-body-sm text-muted-foreground">
                        No registered artist matching "{artistSearch}".
                      </p>
                      <Link
                        href={`/artist/add?returnUrl=/add&name=${encodeURIComponent(artistSearch)}`}
                        className="mt-3 inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3 py-1.5 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
                      >
                        <UserPlus size={16} strokeWidth={1} />
                        <span>Create "{artistSearch}"</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Bottom link to create new artist */}
                <div className="border-t border-border bg-muted/20 p-2.5">
                  <Link
                    href="/artist/add?returnUrl=/add"
                    className="flex w-full items-center justify-center gap-2 text-caption uppercase text-muted-foreground hover:text-accent transition-colors py-1"
                  >
                    <Plus size={16} strokeWidth={1} />
                    <span>Create a new artist profile</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <p className="text-caption text-muted-foreground">
            Select the primary artist or create a new profile if not listed.
          </p>
        </div>

        {/* Featuring Artists Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-caption uppercase text-muted-foreground">
              Featuring Artists <span className="text-muted-foreground/60">(Optional)</span>
            </label>
            <Link
              href="/artist/add?returnUrl=%2Fadd%3Ftarget%3Dfeat"
              className="inline-flex items-center gap-1.5 text-caption uppercase text-muted-foreground hover:text-accent transition-colors"
            >
              <UserPlus size={16} strokeWidth={1} />
              <span>Add New Artist</span>
            </Link>
          </div>

          {/* Selected Featuring Artists Chips */}
          {featuringList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-1">
              {featuringList.map((featName) => (
                <div
                  key={featName}
                  className="inline-flex items-center gap-2 border border-border bg-muted/30 px-3 py-1.5 text-caption uppercase text-foreground"
                >
                  <span>{featName}</span>
                  <button
                    type="button"
                    onClick={() => removeFeaturingArtist(featName)}
                    aria-label={`Remove ${featName}`}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    <X size={16} strokeWidth={1} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden input for formData */}
          <input type="hidden" name="featuring" value={featuringList.join(", ")} />

          {/* Featuring Input + Dropdown Selector with Direct Typing */}
          <div className="relative" ref={featDropdownRef}>
            <div
              className={`flex items-center border ${
                featDropdownOpen ? "border-accent" : "border-border"
              } bg-transparent transition-colors focus-within:border-accent`}
            >
              <input
                type="text"
                value={featSearch}
                onChange={(e) => {
                  setFeatSearch(e.target.value);
                  setFeatDropdownOpen(true);
                }}
                onFocus={() => setFeatDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = featSearch.trim();
                    if (!trimmed) return;
                    const match = artistsList.find(
                      (a) => a.toLowerCase() === trimmed.toLowerCase()
                    );
                    if (match) {
                      addFeaturingArtist(match);
                    }
                  } else if (e.key === "Escape") {
                    setFeatDropdownOpen(false);
                  }
                }}
                placeholder={
                  featuringList.length > 0
                    ? "Type to search or add another featuring artist..."
                    : "Type artist name to search or select (e.g. Lady Gaga)..."
                }
                className="w-full bg-transparent px-4 py-3 text-body font-light text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setFeatDropdownOpen(!featDropdownOpen)}
                className="px-4 py-3 text-muted-foreground hover:text-accent transition-colors shrink-0"
                tabIndex={-1}
                aria-label="Toggle featuring dropdown"
              >
                <ChevronDown
                  size={16}
                  strokeWidth={1}
                  className={`transition-transform ${
                    featDropdownOpen ? "rotate-180 text-accent" : ""
                  }`}
                />
              </button>
            </div>

            {/* Dropdown Menu */}
            {featDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 border border-border bg-background shadow-none">
                {/* Filtered available artists */}
                <div className="max-h-56 overflow-y-auto divide-y divide-border/40">
                  {availableFeaturingArtists.length > 0 ? (
                    availableFeaturingArtists.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => addFeaturingArtist(a)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-body-sm text-foreground transition-colors hover:bg-muted/40 hover:text-accent"
                      >
                        <span>{a}</span>
                        <Plus size={16} strokeWidth={1} className="text-muted-foreground" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-body-sm text-muted-foreground">
                        {featSearch.trim()
                          ? `No registered artist matching "${featSearch.trim()}".`
                          : "All available artists are already selected."}
                      </p>
                      {featSearch.trim() && (
                        <Link
                          href={`/artist/add?returnUrl=%2Fadd%3Ftarget%3Dfeat&name=${encodeURIComponent(featSearch.trim())}`}
                          className="mt-3 inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3 py-1.5 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
                        >
                          <UserPlus size={16} strokeWidth={1} />
                          <span>Create "{featSearch.trim()}"</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom link to create new artist */}
                <div className="border-t border-border bg-muted/20 p-2.5">
                  <Link
                    href={
                      featSearch.trim()
                        ? `/artist/add?returnUrl=%2Fadd%3Ftarget%3Dfeat&name=${encodeURIComponent(featSearch.trim())}`
                        : `/artist/add?returnUrl=%2Fadd%3Ftarget%3Dfeat`
                    }
                    className="flex w-full items-center justify-center gap-2 text-caption uppercase text-muted-foreground hover:text-accent transition-colors py-1"
                  >
                    <Plus size={16} strokeWidth={1} />
                    <span>
                      {featSearch.trim()
                        ? `Create profile for "${featSearch.trim()}"`
                        : "Create a new artist profile"}
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <p className="text-caption text-muted-foreground">
            Songs will appear in the archive and discography for all featured artists.
          </p>
        </div>

        {/* Lyrics */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="lyrics"
              className="text-caption uppercase text-muted-foreground"
            >
              Lyrics <span className="text-accent">*</span>
            </label>
            <span className="text-caption uppercase text-muted-foreground">
              {lineCount} lines · {wordCount} words
            </span>
          </div>
          <textarea
            id="lyrics"
            name="lyrics"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            required
            rows={12}
            className={`${inputCls} font-mono text-body-sm leading-relaxed`}
            placeholder="Type or paste complete song lyrics here..."
          />
        </div>
      </section>

      {/* SECTION 2: CREDITS */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <p className="text-caption uppercase text-muted-foreground tracking-widest">
              02 // Credits
            </p>
            <p className="mt-1 text-caption text-muted-foreground">
              Song credits will be rendered as editorial liner notes on the lyrics page.
            </p>
          </div>
          <Disc size={16} strokeWidth={1} className="text-muted-foreground" />
        </div>

        {/* Songwriters */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="credits_writers"
            className="text-caption uppercase text-muted-foreground"
          >
            Songwriters
          </label>
          <input
            id="credits_writers"
            value={writers}
            onChange={(e) => setWriters(e.target.value)}
            className={inputCls}
            placeholder="e.g. Freddie Mercury (separate multiple with commas)"
          />
        </div>

        {/* Producers */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="credits_producers"
            className="text-caption uppercase text-muted-foreground"
          >
            Producers
          </label>
          <input
            id="credits_producers"
            value={producers}
            onChange={(e) => setProducers(e.target.value)}
            className={inputCls}
            placeholder="e.g. Roy Thomas Baker, Queen"
          />
        </div>


        {/* Audio Engineering / Mixing & Mastering */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="credits_engineering"
            className="text-caption uppercase text-muted-foreground"
          >
            Audio Engineering (Mixing & Mastering)
          </label>
          <input
            id="credits_engineering"
            value={engineering}
            onChange={(e) => setEngineering(e.target.value)}
            className={inputCls}
            placeholder="e.g. Bob Ludwig, Trident Studios"
          />
        </div>

        {/* Custom Credits Rows */}
        {customCredits.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-caption uppercase text-muted-foreground">
              Additional Custom Roles:
            </p>
            {customCredits.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-3 border border-border p-3"
              >
                <div className="w-1/3">
                  <input
                    value={row.role}
                    onChange={(e) =>
                      updateCustomCreditRow(row.id, "role", e.target.value)
                    }
                    placeholder="Role Title (e.g. Arranger)"
                    className="w-full border-b border-border bg-transparent px-2 py-1 text-caption uppercase text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <input
                    value={row.names}
                    onChange={(e) =>
                      updateCustomCreditRow(row.id, "names", e.target.value)
                    }
                    placeholder="Names (comma separated)"
                    className="w-full border-b border-border bg-transparent px-2 py-1 text-body-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCustomCreditRow(row.id)}
                  aria-label="Remove role"
                  className="flex size-8 shrink-0 items-center justify-center border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  <X size={16} strokeWidth={1} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Credit Button */}
        <div>
          <button
            type="button"
            onClick={addCustomCreditRow}
            className="inline-flex items-center gap-2 border border-dashed border-border px-4 py-2.5 text-caption uppercase text-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus size={16} strokeWidth={1} />
            <span>Add Custom Role</span>
          </button>
        </div>
      </section>

      {/* SECTION 3: MEDIA & CONTEXT (About Artist has been moved to Add Artist page) */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            03 // Media & Context (Optional)
          </p>
          <Music size={16} strokeWidth={1} className="text-muted-foreground" />
        </div>

        {/* Cover Art Upload with Sharp Preview */}
        <div className="flex flex-col gap-3">
          <label
            htmlFor="image"
            className="text-caption uppercase text-muted-foreground"
          >
            Cover Artwork
          </label>

          <div className="flex flex-col sm:flex-row items-start gap-6 border border-border p-6 bg-muted/20">
            {/* Sharp Preview Box */}
            <div className="size-36 shrink-0 border border-border bg-background flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview cover"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <Upload size={16} strokeWidth={1} className="mb-2" />
                  <span className="text-[11px] uppercase tracking-wider">
                    Upload Image
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between self-stretch gap-4">
              <div>
                <p className="text-body-sm text-foreground font-light">
                  Upload square cover art or editorial song poster.
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  Supported formats: JPG, PNG, WebP (max 5MB).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer border border-foreground bg-foreground px-4 py-2 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors">
                  Choose File
                  <input
                    ref={fileInputRef}
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="border border-border px-4 py-2 text-caption uppercase text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* YouTube Embed URL */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="youtubeUrl"
            className="text-caption uppercase text-muted-foreground"
          >
            YouTube Video URL
          </label>
          <input
            id="youtubeUrl"
            name="youtubeUrl"
            className={inputCls}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-caption text-muted-foreground">
            Will be embedded as a responsive video player on the lyrics page.
          </p>
        </div>
      </section>

      {/* SECTION 4: ACTIONS & SUBMIT */}
      <section className="border-t border-border pt-8 flex flex-wrap items-center justify-between gap-6">
        <Link
          href="/"
          onClick={() => {
            try {
              sessionStorage.removeItem("lyrarium_add_song_draft");
            } catch {
              // ignore
            }
          }}
          className="text-caption uppercase text-muted-foreground hover:text-accent transition-colors"
        >
          // Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending || !artist}
          className="flex items-center gap-3 border border-foreground bg-foreground px-8 py-4 text-body font-light text-background hover:border-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
        >
          <span>{isPending ? "Saving Song..." : "Save Song to Archive"}</span>
          <ArrowRight size={16} strokeWidth={1} />
        </button>
      </section>
    </form>
  );
}
