import { cn } from '@/lib/utils';
import type { SessionClue } from '@/lib/types/session';

export interface EvidenceSectionProps {
  title: string;
  clues: SessionClue[];
  required?: boolean;
}

export function EvidenceSection({
  title,
  clues,
  required = false,
}: EvidenceSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold tracking-tight text-[#fff9ef]">
          {title}
        </h3>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-[11px] font-bold ring-1',
            required
              ? 'bg-gold/10 text-gold ring-gold/25'
              : 'bg-[#fff9ef]/[0.04] text-[#fff9ef]/50 ring-[#fff9ef]/10'
          )}
        >
          {clues.length}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {clues.map((clue) => (
          <article
            key={clue.id}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-4',
              required
                ? 'border-gold/25 bg-gold/[0.06]'
                : 'border-clue-border/30 bg-[#fff4d8]/[0.05]'
            )}
          >
            <div
              className={cn(
                'absolute top-0 left-0 h-full w-1',
                required ? 'bg-gold' : 'bg-[#fff9ef]/30'
              )}
            />
            <h4 className="font-heading pl-2 text-lg font-semibold tracking-tight text-[#fff9ef]">
              {clue.title}
            </h4>
            <p className="mt-1 pl-2 text-sm leading-6 text-[#fff9ef]/65">
              {clue.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
