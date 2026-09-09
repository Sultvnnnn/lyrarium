export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span
      aria-label="Lyrarium"
      className={`flex size-8 shrink-0 items-center justify-center text-caption font-light ${
        inverted
          ? "bg-bone-white text-navy-ink dark:bg-navy-ink dark:text-bone-white"
          : "bg-ink-black text-bone-white dark:bg-bone-white dark:text-navy-ink"
      }`}
    >
      Ly
    </span>
  );
}
