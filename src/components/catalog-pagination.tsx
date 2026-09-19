"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CatalogPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
};

function getPaginationRange(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function CatalogPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPaginationRange(currentPage, totalPages);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="border-t border-border pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* Editorial Counter & Range */}
      <div className="flex items-center gap-2 text-caption uppercase tracking-widest text-muted-foreground select-none">
        <span>
          Page {String(currentPage).padStart(2, "0")} // {String(totalPages).padStart(2, "0")}.
        </span>
        <span>•</span>
        <span>
          Index {String(startItem).padStart(2, "0")}–{String(endItem).padStart(2, "0")} of {totalItems}
        </span>
      </div>

      {/* Pagination Controls */}
      <nav aria-label="Catalog pagination" className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`flex items-center gap-1.5 h-9 px-3 border border-border text-caption uppercase tracking-widest transition-colors select-none ${
            currentPage <= 1
              ? "opacity-30 cursor-not-allowed text-muted-foreground"
              : "text-foreground hover:border-accent hover:text-accent"
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} strokeWidth={1} />
          <span>Prev.</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((item, idx) => {
            if (item === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex items-center justify-center min-w-[32px] h-9 px-1 text-caption text-muted-foreground select-none"
                >
                  ...
                </span>
              );
            }

            const isCurrent = item === currentPage;

            return (
              <button
                key={`page-${item}`}
                type="button"
                onClick={() => onPageChange(item)}
                className={`flex items-center justify-center min-w-[36px] h-9 px-2 text-caption font-mono uppercase tracking-wider transition-colors select-none border ${
                  isCurrent
                    ? "border-accent bg-accent text-accent-foreground font-medium"
                    : "border-border text-foreground hover:border-accent hover:text-accent"
                }`}
                aria-label={`Page ${item}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                {String(item).padStart(2, "0")}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`flex items-center gap-1.5 h-9 px-3 border border-border text-caption uppercase tracking-widest transition-colors select-none ${
            currentPage >= totalPages
              ? "opacity-30 cursor-not-allowed text-muted-foreground"
              : "text-foreground hover:border-accent hover:text-accent"
          }`}
          aria-label="Next page"
        >
          <span>Next.</span>
          <ChevronRight size={16} strokeWidth={1} />
        </button>
      </nav>
    </div>
  );
}
