import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  readonly label: string;
  readonly href?: string;
};

type BreadcrumbsProps = {
  readonly items: readonly BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-[var(--pb-space-6)]">
      <ol className="flex flex-wrap items-center gap-[var(--pb-space-1)] text-sm text-[var(--pb-text-secondary)]">
        <li>
          <Link
            className="transition-colors hover:text-[var(--pb-brand-primary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] rounded-[var(--pb-radius-xs)]"
            href="/buscar"
          >
            Inicio
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-[var(--pb-space-1)]">
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
              {item.href && !isLast ? (
                <Link
                  className="transition-colors hover:text-[var(--pb-brand-primary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] rounded-[var(--pb-radius-xs)]"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-semibold text-[var(--pb-text-primary)]" : "text-[var(--pb-text-secondary)]"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
