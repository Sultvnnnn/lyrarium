"use client";

import { useEffect, useState } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";

type LyricsBreadcrumbProps = {
  songTitle: string;
  artistName: string;
  artistSlug: string;
  fromParam?: string;
  featuringArtists?: { name: string; slug: string }[];
};

export function LyricsBreadcrumb({
  songTitle,
  artistName,
  artistSlug,
  fromParam,
  featuringArtists = [],
}: LyricsBreadcrumbProps) {
  const [fromArtist, setFromArtist] = useState(Boolean(fromParam));
  const [activeArtist, setActiveArtist] = useState({
    name: artistName,
    slug: artistSlug,
  });

  useEffect(() => {
    // If not passed via query param, check if user navigated from artist page via referrer
    if (typeof document !== "undefined") {
      const ref = document.referrer;
      if (ref.includes("/artist/")) {
        setFromArtist(true);

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
  }, [artistName, artistSlug, featuringArtists]);

  const items: BreadcrumbItem[] = fromArtist
    ? [
        { label: "Home", href: "/" },
        { label: "Artists", href: "/#artists" },
        { label: activeArtist.name, href: `/artist/${activeArtist.slug}` },
        { label: songTitle },
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Lyrics", href: "/#collection" },
        { label: songTitle },
      ];

  return <Breadcrumb items={items} />;
}
