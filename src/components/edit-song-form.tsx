"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  Upload,
  ArrowRight,
  Music,
  Disc,
  Check,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { updateSong } from "@/app/actions/songs";
import {
  parseCredits,
  serializeCredits,
  type StructuredCredit,
} from "@/lib/credits";
import {
  type YouTubeVideo,
  parseYouTubeVideos,
  serializeYouTubeVideos,
} from "@/lib/youtube";

type CustomCreditRow = {
  id: string;
  role: string;
  names: string;
};

export type ExistingArtwork = {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  imageUrl: string;
};

type SongData = {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  featuring: string | null;
  lyrics: string;
  imageUrl: string | null;
  aboutArtist: string | null;
  credits: string | null;
  youtubeUrl: string | null;
};

const inputCls =
  "w-full border border-border bg-transparent px-4 py-3 text-body font-light text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";

export function EditSongForm({
  song,
  artistsList = [],
  existingArtworks = [],
  error,
}: {
  song: SongData;
  artistsList?: string[];
  existingArtworks?: ExistingArtwork[];
  error?: string;
}) {
  const [isPending, startTransition] = useTransition();

  // Initial parsed credits
  const initialParsedCredits = useMemo(() => {
    return parseCredits(song.credits);
  }, [song.credits]);

  // Field states initialized from song
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [artistSearch, setArtistSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [album, setAlbum] = useState(song.album || "");
  const [lyrics, setLyrics] = useState(song.lyrics);

  // Featuring artists
  const initialFeaturing = useMemo(() => {
    if (song.featuring) {
      return song.featuring
        .split(/,\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // Fallback: check parsed credits for Featuring role
    const featCredit = initialParsedCredits.find(
      (c) => c.role.toLowerCase() === "featuring"
    );
    return featCredit ? featCredit.names : [];
  }, [song.featuring, initialParsedCredits]);

  const [featuringList, setFeaturingList] = useState<string[]>(initialFeaturing);
  const [featSearch, setFeatSearch] = useState("");
  const [featDropdownOpen, setFeatDropdownOpen] = useState(false);

  // Credits parsing
  const initialWriters = useMemo(() => {
    const row = initialParsedCredits.find((c) =>
      /^songwriters?$|^writers?$/i.test(c.role)
    );
    return row ? row.names.join(", ") : "";
  }, [initialParsedCredits]);

  const initialProducers = useMemo(() => {
    const row = initialParsedCredits.find((c) => /^producers?$/i.test(c.role));
    return row ? row.names.join(", ") : "";
  }, [initialParsedCredits]);

  const initialEngineering = useMemo(() => {
    const row = initialParsedCredits.find((c) =>
      /mixing|mastering|audio\s*engineering/i.test(c.role)
    );
    return row ? row.names.join(", ") : "";
  }, [initialParsedCredits]);

  const initialCustomCredits = useMemo(() => {
    return initialParsedCredits
      .filter((c) => {
        const r = c.role.toLowerCase();
        return (
          !/^songwriters?$|^writers?$/i.test(r) &&
          !/^producers?$/i.test(r) &&
          !/mixing|mastering|audio\s*engineering/i.test(r) &&
          r !== "main artist" &&
          r !== "featuring" &&
          r !== "credits"
        );
      })
      .map((c) => ({
        id: Math.random().toString(36).slice(2, 9),
        role: c.role,
        names: c.names.join(", "),
      }));
  }, [initialParsedCredits]);

  const [writers, setWriters] = useState(initialWriters);
  const [producers, setProducers] = useState(initialProducers);
  const [engineering, setEngineering] = useState(initialEngineering);
  const [customCredits, setCustomCredits] =
    useState<CustomCreditRow[]>(initialCustomCredits);

  // Media & Context
  const [aboutArtist, setAboutArtist] = useState(song.aboutArtist || "");
  const initialYoutubeVideos = useMemo(() => {
    const parsed = parseYouTubeVideos(song.youtubeUrl);
    if (parsed.length > 0) return parsed;
    return [{ title: "Music Video", url: "" }];
  }, [song.youtubeUrl]);
  const [youtubeVideos, setYoutubeVideos] =
    useState<YouTubeVideo[]>(initialYoutubeVideos);
  const [imagePreview, setImagePreview] = useState<string | null>(song.imageUrl);
  const [removeImage, setRemoveImage] = useState(false);

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

  // Existing Artworks and Album suggestions
  const artistAlbums = useMemo(() => {
    if (!artist) return [];
    const set = new Set<string>();
    existingArtworks.forEach((a) => {
      if (a.artist.toLowerCase() === artist.toLowerCase() && a.album) {
        set.add(a.album.trim());
      }
    });
    return Array.from(set);
  }, [existingArtworks, artist]);

  const artistArtworks = useMemo(() => {
    if (!artist) return [];
    return existingArtworks.filter(
      (a) => a.artist.toLowerCase() === artist.toLowerCase() && a.imageUrl
    );
  }, [existingArtworks, artist]);

  const otherArtworks = useMemo(() => {
    return existingArtworks.filter(
      (a) => a.artist.toLowerCase() !== artist.toLowerCase() && a.imageUrl
    );
  }, [existingArtworks, artist]);

  // Artwork selection state
  const [artworkSource, setArtworkSource] = useState<"upload" | "existing">("upload");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [selectedArtworkMeta, setSelectedArtworkMeta] = useState<{
    title: string;
    album: string | null;
    artist: string;
  } | null>(null);
  const [showAllArtworks, setShowAllArtworks] = useState(false);

  const selectExistingArtwork = (art: ExistingArtwork) => {
    setExistingImageUrl(art.imageUrl);
    setImagePreview(art.imageUrl);
    setRemoveImage(false);
    setSelectedArtworkMeta({
      title: art.title,
      album: art.album,
      artist: art.artist,
    });
    if (!album && art.album) {
      setAlbum(art.album);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setRemoveImage(false);
      setExistingImageUrl(null);
      setSelectedArtworkMeta(null);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setRemoveImage(true);
    setExistingImageUrl(null);
    setSelectedArtworkMeta(null);
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

  const addYoutubeVideo = () => {
    setYoutubeVideos((prev) => [
      ...prev,
      { title: "", url: "" },
    ]);
  };

  const removeYoutubeVideo = (index: number) => {
    setYoutubeVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const updateYoutubeVideo = (
    index: number,
    field: "title" | "url",
    value: string
  ) => {
    setYoutubeVideos((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              ...(index === 0 && field === "title" ? { title: "Music Video" } : {}),
            }
          : item
      )
    );
  };

  const handleSubmit = (formData: FormData) => {
    formData.set("id", String(song.id));
    formData.set("artist", artist);
    formData.set("album", album);
    formData.set("featuring", featuringList.join(", "));
    formData.set("existingImageUrl", existingImageUrl || "");
    formData.set("aboutArtist", aboutArtist);
    formData.set("removeImage", removeImage ? "true" : "false");
    formData.set("currentImageUrl", song.imageUrl || "");

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

    const serializedVideos = serializeYouTubeVideos(youtubeVideos);
    if (serializedVideos) {
      formData.set("youtubeUrl", serializedVideos);
    } else {
      formData.delete("youtubeUrl");
    }

    startTransition(async () => {
      await updateSong(song.id, formData);
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
              href={`/artist/add?returnUrl=${encodeURIComponent(`/lyrics/${song.id}/edit`)}`}
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
                          artist === a
                            ? "text-accent bg-muted/20"
                            : "text-foreground"
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
                        href={`/artist/add?returnUrl=${encodeURIComponent(`/lyrics/${song.id}/edit`)}&name=${encodeURIComponent(artistSearch)}`}
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
                    href={`/artist/add?returnUrl=${encodeURIComponent(`/lyrics/${song.id}/edit`)}`}
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
              Featuring Artists{" "}
              <span className="text-muted-foreground/60">(Optional)</span>
            </label>
            <Link
              href={`/artist/add?returnUrl=${encodeURIComponent(`/lyrics/${song.id}/edit`)}`}
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
          <input
            type="hidden"
            name="featuring"
            value={featuringList.join(", ")}
          />

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
                        <Plus
                          size={16}
                          strokeWidth={1}
                          className="text-muted-foreground"
                        />
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
                          href={`/artist/add?returnUrl=${encodeURIComponent(`/lyrics/${song.id}/edit`)}&name=${encodeURIComponent(featSearch.trim())}`}
                          className="mt-3 inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3 py-1.5 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
                        >
                          <UserPlus size={16} strokeWidth={1} />
                          <span>Create "{featSearch.trim()}"</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-border bg-muted/20 p-2.5">
                  <Link
                    href={
                      featSearch.trim()
                        ? `/artist/add?returnUrl=${encodeURIComponent(`/lyrics/${song.id}/edit`)}&name=${encodeURIComponent(featSearch.trim())}`
                        : `/artist/add?returnUrl=${encodeURIComponent(`/lyrics/${song.id}/edit`)}`
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

        {/* Album (Optional) */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="album"
            className="text-caption uppercase text-muted-foreground"
          >
            Album Name <span className="text-muted-foreground/60">(Optional)</span>
          </label>
          <input
            id="album"
            name="album"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            className={inputCls}
            placeholder="e.g. A Night at the Opera"
            list="album-suggestions"
          />
          {artistAlbums.length > 0 && (
            <datalist id="album-suggestions">
              {artistAlbums.map((alb) => (
                <option key={alb} value={alb} />
              ))}
            </datalist>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption text-muted-foreground">
              If this track belongs to an album, EP, or LP, enter the title here.
            </p>
            {album.trim() &&
              artistArtworks.some(
                (a) => a.album?.toLowerCase() === album.trim().toLowerCase()
              ) &&
              existingImageUrl !==
                artistArtworks.find(
                  (a) => a.album?.toLowerCase() === album.trim().toLowerCase()
                )?.imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const matching = artistArtworks.find(
                      (a) =>
                        a.album?.toLowerCase() === album.trim().toLowerCase()
                    );
                    if (matching) selectExistingArtwork(matching);
                  }}
                  className="inline-flex items-center gap-1.5 text-caption uppercase text-accent hover:underline transition-colors"
                >
                  <Check size={14} strokeWidth={1} />
                  <span>Use artwork for album "{album.trim()}"</span>
                </button>
              )}
          </div>
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
            rows={14}
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
              Song credits are rendered as editorial liner notes on the lyrics page.
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

      {/* SECTION 3: MEDIA & CONTEXT */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <p className="text-caption uppercase text-muted-foreground tracking-widest">
            03 // Media & Context (Optional)
          </p>
          <Music size={16} strokeWidth={1} className="text-muted-foreground" />
        </div>

        {/* Cover Artwork with Upload / Existing Picker */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="image"
              className="text-caption uppercase text-muted-foreground"
            >
              Cover Artwork
            </label>

            {/* Source Switcher: Upload vs Existing */}
            <div className="flex items-center border border-border">
              <button
                type="button"
                onClick={() => setArtworkSource("upload")}
                className={`px-3 py-1.5 text-caption uppercase transition-colors ${
                  artworkSource === "upload"
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-accent"
                }`}
              >
                Upload / Current
              </button>
              <button
                type="button"
                onClick={() => setArtworkSource("existing")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-caption uppercase border-l border-border transition-colors ${
                  artworkSource === "existing"
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-accent"
                }`}
              >
                <span>Existing Artworks</span>
                <span className="text-[10px] font-mono px-1 py-0.5 border border-current">
                  {artistArtworks.length}
                </span>
              </button>
            </div>
          </div>

          {/* Mode 1: Current / Upload New File */}
          {artworkSource === "upload" && (
            <div className="flex flex-col sm:flex-row items-start gap-6 border border-border p-6 bg-muted/20">
              {/* Sharp Preview Box */}
              <div className="size-36 shrink-0 border border-border bg-background flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                    <Upload size={16} strokeWidth={1} className="mb-2" />
                    <span className="text-[11px] uppercase tracking-wider">
                      No Artwork
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between self-stretch gap-4">
                <div>
                  <p className="text-body-sm text-foreground font-light">
                    {imagePreview
                      ? "Cover artwork is active. You can upload a replacement or remove it."
                      : "Upload square cover art or editorial song poster."}
                  </p>
                  <p className="mt-1 text-caption text-muted-foreground">
                    Supported formats: JPG, PNG, WebP (max 5MB). Content hash deduplication prevents duplicate storage files.
                  </p>
                  {existingImageUrl && (
                    <p className="mt-2 text-caption text-accent">
                      // Selected shared artwork ({selectedArtworkMeta?.album || selectedArtworkMeta?.title || "Existing"}).
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer border border-foreground bg-foreground px-4 py-2 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors">
                    {imagePreview ? "Change File" : "Choose File"}
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
                      onClick={handleRemoveImage}
                      className="border border-border px-4 py-2 text-caption uppercase text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                    >
                      Remove Artwork
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Select from Existing Artworks */}
          {artworkSource === "existing" && (
            <div className="flex flex-col gap-4 border border-border p-6 bg-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-body-sm text-foreground font-light">
                    {artist
                      ? `Select existing artwork by ${artist}:`
                      : "Select an artist to view available artworks."}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5">
                    Reusing cover artwork shares the file across album tracks without consuming additional storage.
                  </p>
                </div>
                {otherArtworks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllArtworks(!showAllArtworks)}
                    className="text-caption uppercase text-muted-foreground hover:text-accent transition-colors"
                  >
                    {showAllArtworks
                      ? `// Show only ${artist || "artist"} (${artistArtworks.length})`
                      : `// Browse all archive covers (${existingArtworks.length})`}
                  </button>
                )}
              </div>

              {/* Grid of Artworks */}
              {(() => {
                const listToDisplay = showAllArtworks
                  ? existingArtworks
                  : artistArtworks;

                if (listToDisplay.length === 0) {
                  return (
                    <div className="py-8 text-center border border-dashed border-border bg-background/50">
                      <p className="text-body-sm text-muted-foreground">
                        No previous artworks found for {artist || "this artist"}.
                      </p>
                      <button
                        type="button"
                        onClick={() => setArtworkSource("upload")}
                        className="mt-3 inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3 py-1.5 text-caption uppercase text-background hover:bg-accent hover:border-accent hover:text-accent-foreground transition-colors"
                      >
                        <Upload size={16} strokeWidth={1} />
                        <span>Upload New Artwork</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                    {listToDisplay.map((art) => {
                      const isSelected =
                        imagePreview === art.imageUrl ||
                        existingImageUrl === art.imageUrl;
                      return (
                        <button
                          key={`${art.id}-${art.imageUrl}`}
                          type="button"
                          onClick={() => selectExistingArtwork(art)}
                          className={`group relative text-left border transition-colors ${
                            isSelected
                              ? "border-accent bg-background"
                              : "border-border bg-background hover:border-accent"
                          }`}
                        >
                          <div className="aspect-square w-full overflow-hidden bg-muted/30">
                            <img
                              src={art.imageUrl}
                              alt={art.album || art.title}
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="p-2">
                            <p className="truncate text-[11px] font-normal uppercase text-foreground group-hover:text-accent transition-colors">
                              {art.album || art.title}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {art.album ? `Album // ${art.artist}` : art.artist}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-accent text-accent-foreground p-0.5">
                              <Check size={16} strokeWidth={1} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {imagePreview && (
                <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                  <div className="flex items-center gap-2 text-caption">
                    <span className="text-muted-foreground">Active Artwork:</span>
                    <span className="text-foreground font-normal">
                      {selectedArtworkMeta?.album
                        ? `Album: ${selectedArtworkMeta.album}`
                        : selectedArtworkMeta?.title || (imagePreview === song.imageUrl ? "Current Artwork" : "Selected Artwork")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-caption uppercase text-muted-foreground hover:text-accent transition-colors"
                  >
                    Remove Artwork
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* YouTube Videos Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-caption uppercase text-muted-foreground">
              YouTube Videos <span className="text-muted-foreground/60">(Optional)</span>
            </label>
            <span className="text-caption text-muted-foreground font-mono text-[11px]">
              {youtubeVideos.length} {youtubeVideos.length === 1 ? "video" : "videos"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {youtubeVideos.map((vid, idx) => (
              <div
                key={idx}
                className="border border-border p-4 bg-muted/10 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption uppercase tracking-wider text-foreground font-normal">
                    {idx === 0
                      ? "01 // Main Video (Music Video)"
                      : `0${idx + 1} // Additional Video`}
                  </span>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => removeYoutubeVideo(idx)}
                      aria-label={`Remove video ${idx + 1}`}
                      className="flex size-7 items-center justify-center border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                    >
                      <X size={16} strokeWidth={1} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">
                  {/* Video Title / Label */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      Title / Label
                    </label>
                    {idx === 0 ? (
                      <input
                        type="text"
                        value="Music Video"
                        readOnly
                        disabled
                        className="w-full border border-border bg-muted/40 px-3 py-2 text-body-sm font-light text-muted-foreground cursor-not-allowed select-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={vid.title}
                        onChange={(e) =>
                          updateYoutubeVideo(idx, "title", e.target.value)
                        }
                        placeholder="e.g. Live Performance, Acoustic"
                        className="w-full border border-border bg-transparent px-3 py-2 text-body-sm font-light text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                      />
                    )}
                  </div>

                  {/* Video URL */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="text"
                      value={vid.url}
                      onChange={(e) =>
                        updateYoutubeVideo(idx, "url", e.target.value)
                      }
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full border border-border bg-transparent px-3 py-2 text-body-sm font-light text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <button
              type="button"
              onClick={addYoutubeVideo}
              className="inline-flex items-center gap-2 border border-dashed border-border px-4 py-2.5 text-caption uppercase text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <Plus size={16} strokeWidth={1} />
              <span>Add Another YouTube Video</span>
            </button>
          </div>

          <p className="text-caption text-muted-foreground">
            Music video and additional performances will appear in an editorial sliding carousel on the lyrics page.
          </p>
        </div>

        {/* About the Artist */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="aboutArtist"
            className="text-caption uppercase text-muted-foreground"
          >
            About The Artist // Song Commentary
          </label>
          <textarea
            id="aboutArtist"
            name="aboutArtist"
            value={aboutArtist}
            onChange={(e) => setAboutArtist(e.target.value)}
            rows={4}
            className={`${inputCls} text-body-sm leading-relaxed`}
            placeholder="Editorial background, biography, or specific song context..."
          />
          <p className="text-caption text-muted-foreground">
            Editorial bio or commentary shown in the sidebar of the song page.
          </p>
        </div>
      </section>

      {/* SECTION 4: ACTIONS & SUBMIT */}
      <section className="border-t border-border pt-8 flex flex-wrap items-center justify-between gap-6">
        <Link
          href={`/lyrics/${song.id}`}
          className="text-caption uppercase text-muted-foreground hover:text-accent transition-colors"
        >
          // Cancel & Discard
        </Link>

        <button
          type="submit"
          disabled={isPending || !artist || !title || !lyrics}
          className="flex items-center gap-3 border border-foreground bg-foreground px-8 py-4 text-body font-light text-background hover:border-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
        >
          <span>{isPending ? "Saving Changes..." : "Save Changes"}</span>
          <ArrowRight size={16} strokeWidth={1} />
        </button>
      </section>
    </form>
  );
}
