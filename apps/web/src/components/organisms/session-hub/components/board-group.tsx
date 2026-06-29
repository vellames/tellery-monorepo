import type { Users } from 'lucide-react';

export interface BoardGroupProps {
  icon: typeof Users;
  title: string;
  count: number;
  children: React.ReactNode;
}

export function BoardGroup({
  icon: Icon,
  title,
  count,
  children,
}: BoardGroupProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <h3 className="inline-flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-[#fff9ef]/60 uppercase">
        <Icon className="text-gold size-4" />
        {title}
        <span className="text-[#fff9ef]/35">· {count}</span>
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}
