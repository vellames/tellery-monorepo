import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCENT_RING: Record<string, string> = {
  emerald: 'group-hover:border-success/50',
  amber: 'group-hover:border-gold/50',
  rose: 'group-hover:border-[#e88a96]/50',
};

export interface LeadCardProps {
  name: string;
  meta?: string;
  description: string;
  imageUrl?: string | null;
  cluesLabel: string;
  easyMode: boolean;
  cluesFound: number;
  cluesTotal: number;
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
  ctaLabel: string;
  accent: 'emerald' | 'amber' | 'rose';
  portrait?: boolean;
  onClick: () => void;
}

export function LeadCard({
  name,
  meta,
  description,
  imageUrl,
  cluesLabel,
  easyMode,
  cluesFound,
  cluesTotal,
  done,
  doneLabel,
  pendingLabel,
  ctaLabel,
  accent,
  portrait,
  onClick,
}: LeadCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] text-left transition duration-300 hover:-translate-y-1 hover:bg-[#fff9ef]/[0.06]',
        ACCENT_RING[accent]
      )}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden',
          portrait ? 'aspect-[4/3]' : 'aspect-video'
        )}
      >
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] to-[#160a08]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120406] via-[#120406]/20 to-transparent" />

        <span
          className={cn(
            'absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase backdrop-blur',
            done
              ? 'bg-success/25 text-[#b9e4c5] ring-1 ring-[#b9e4c5]/30'
              : 'bg-black/40 text-[#fff9ef]/70 ring-1 ring-[#fff9ef]/15'
          )}
        >
          {done && <CheckCircle2 className="size-3" />}
          {done ? doneLabel : pendingLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h4 className="font-heading text-lg leading-tight font-semibold tracking-tight text-[#fff9ef]">
          {name}
        </h4>
        {meta && (
          <p className="text-gold text-[11px] font-semibold tracking-wide uppercase">
            {meta}
          </p>
        )}
        <p className="line-clamp-2 text-sm leading-6 text-[#fff9ef]/60">
          {description}
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gold/80 text-xs font-medium">
              {cluesLabel}
            </span>
            <span className="text-[11px] font-bold text-[#fff9ef]/0 transition group-hover:text-[#fff9ef]/80">
              {ctaLabel} →
            </span>
          </div>
          {easyMode && cluesTotal > 0 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#fff9ef]/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c49a4a] to-[#f4d78f] transition-[width] duration-700"
                style={{
                  width: `${Math.round((cluesFound / cluesTotal) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
