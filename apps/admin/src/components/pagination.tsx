import Link from 'next/link';

import { cn } from '@/lib/utils';

export function Pagination({
  basePath,
  page,
  totalPages,
  extraParams,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  /** Extra query params to preserve (e.g. status filter), already URL-encoded. */
  extraParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    params.set('page', String(target));
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) params.set(key, value);
    }
    return `${basePath}?${params.toString()}`;
  };

  const linkClass = (disabled: boolean) =>
    cn(
      'inline-flex h-8 items-center gap-1 rounded-md border px-3 text-sm transition-colors',
      disabled
        ? 'border-border/60 text-muted-foreground/40 pointer-events-none'
        : 'border-border hover:bg-muted'
    );

  return (
    <nav
      className="text-muted-foreground mt-4 flex items-center justify-between text-sm"
      aria-label="Paginação"
    >
      <Link
        href={buildHref(Math.max(1, page - 1))}
        className={linkClass(!hasPrev)}
      >
        ← Anterior
      </Link>
      <span className="tabular-nums">
        Página {page} de {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        className={linkClass(!hasNext)}
      >
        Próxima →
      </Link>
    </nav>
  );
}
