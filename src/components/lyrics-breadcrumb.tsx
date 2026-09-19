"use client";

import { useEffect, useState } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";

type LyricsBreadcrumbProps = {
  songTitle: string;
  artistName: string;
  artistSlug: string;
  fromParam?: string;
  featuringArtists?: { name: string; slug: string }[];
  scopedArtistName?: string;
  scopedArtistSlug?: string;
};

export function LyricsBreadcrumb({
  songTitle,
  artistName,
  artistSlug,
  fromParam,
  featuringArtists = [],
  scopedArtistName,
  scopedArtistSlug,
}: LyricsBreadcrumbProps) {
  const [isFromSongs, setIsFromSongs] = useState(fromParam === "songs");
  const [activeArtist, setActiveArtist] = useState({
    name: scopedArtistName || artistName,
    slug: scopedArtistSlug || artistSlug,
  });

  useEffect(() => {
    if (scopedArtistName && scopedArtistSlug) {
      setActiveArtist({ name: scopedArtistName, slug: scopedArtistSlug });
      return;
    }

    if (typeof document !== "undefined") {
      const ref = document.referrer;
      if (!fromParam && ref.includes("/songs")) {
        setIsFromSongs(true);
        return;
      }

      if (ref.includes("/artist/")) {
        // Check if referrer matches any featuring artist
        const matchedFeat = featuringArtists.find((feat) =>
          ref.includes(`/artist/${feat.slug}`)
        );

        if (matchedFeat) {
          setActiveArtist({ name: matchedFeat.name, slug: matchedFeat.slug });
        } else if (ref.includes(`/artist/${artistSlug}`)) {
          setActiveArtist({ name: artistName, slug: artistSlug });
        }
      }
    }
  }, [artistName, artistSlug, featuringArtists, scopedArtistName, scopedArtistSlug, fromParam]);

  const items: BreadcrumbItem[] = isFromSongs
    ? [
        { label: "Home", href: "/" },
        { label: "Songs", href: "/songs" },
        { label: songTitle },
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Artists", href: "/artist" },
        { label: activeArtist.name, href: `/artist/${activeArtist.slug}` },
        { label: songTitle },
      ];

  return <Breadcrumb items={items} />;
}
