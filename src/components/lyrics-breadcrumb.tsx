"use client";

import { useEffect, useState } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";

type LyricsBreadcrumbProps = {
  songTitle: string;
  artistName: string;
  artistSlug: string;
  fromParam?: string;
};

export function LyricsBreadcrumb({
  songTitle,
  artistName,
  artistSlug,
  fromParam,
}: LyricsBreadcrumbProps) {
  const [fromArtist, setFromArtist] = useState(fromParam === "artist");

  useEffect(() => {
    // If not passed via query param, check if user navigated from artist page via referrer
    if (!fromArtist && typeof document !== "undefined") {
      if (
        document.referrer.includes("/artist/") ||
        document.referrer.includes(`/artist/${artistSlug}`)
      ) {
        setFromArtist(true);
      }
    }
  }, [fromArtist, artistSlug]);

  const items: BreadcrumbItem[] = fromArtist
    ? [
        { label: "Home", href: "/" },
        { label: "Artists", href: "/#artists" },
        { label: artistName, href: `/artist/${artistSlug}` },
        { label: songTitle },
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Lyrics", href: "/#collection" },
        { label: songTitle },
      ];

  return <Breadcrumb items={items} />;
}
