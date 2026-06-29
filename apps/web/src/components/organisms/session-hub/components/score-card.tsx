import type { Award } from 'lucide-react';

export interface ScoreCardProps {
  icon: typeof Award;
  label: string;
  value: number;
  total: number;
}

export function ScoreCard({ icon: Icon, label, value, total }: ScoreCardProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[#fff9ef]/8 bg-[#0a0203]/40 p-4">
      <div className="text-gold/70 mb-2 flex items-center gap-1.5">
        <Icon className="size-3.5" />
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-heading text-2xl font-bold text-[#fff9ef]">
          {value}
        </span>
        <span className="text-sm text-[#fff9ef]/40">/{total}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#fff9ef]/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c49a4a] to-[#f4d78f] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
