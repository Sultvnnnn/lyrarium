import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center flex-wrap gap-2 text-caption uppercase tracking-wider ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-muted-foreground/40 select-none font-mono">
                //
              </span>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-accent transition-colors underline-offset-4 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
