'use client';

import { Fingerprint, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { SessionObject } from '@/lib/types/session';

export interface LocationObjectListProps {
  objects: SessionObject[];
  easyMode: boolean;
  onSelectObject: (object: SessionObject) => void;
}

export function LocationObjectList({
  objects,
  easyMode,
  onSelectObject,
}: LocationObjectListProps) {
  const t = useTranslations('play');
  const tp = useTranslations('play.panel');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-gold inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase">
        <Search className="size-3.5" />
        {tp('objectsHere')}
      </h3>
      {objects.length === 0 ? (
        <p className="text-sm text-[#fff9ef]/45">{tp('noObjectsHere')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {objects.map((object) => (
            <button
              key={object.id}
              type="button"
              onClick={() => onSelectObject(object)}
              className="group hover:border-gold/40 flex cursor-pointer items-center gap-3.5 rounded-xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] p-3 text-left transition hover:bg-[#fff9ef]/[0.06]"
            >
              {object.imageUrl ? (
                <div className="size-12 shrink-0 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={object.imageUrl}
                    alt={object.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#37050d] to-[#160a08]">
                  <Fingerprint className="text-gold/60 size-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-heading text-base font-semibold text-[#fff9ef]">
                  {object.name}
                </h4>
                <p className="line-clamp-1 text-xs text-[#fff9ef]/55">
                  {object.shortDescription}
                </p>
                {easyMode &&
                  (object.cluesTotal === 0 ? (
                    <p className="mt-0.5 text-[11px] font-medium text-[#fff9ef]/35">
                      {t('noCluesAvailable')}
                    </p>
                  ) : (
                    <p className="text-gold/80 mt-0.5 text-[11px] font-semibold">
                      {t('cluesHereEasy', {
                        found: object.discoveredClues.length,
                        total: object.cluesTotal,
                      })}
                    </p>
                  ))}
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase',
                  object.inspected
                    ? 'bg-success/25 text-[#b9e4c5] ring-1 ring-[#b9e4c5]/30'
                    : 'bg-black/40 text-[#fff9ef]/60 ring-1 ring-[#fff9ef]/15'
                )}
              >
                {object.inspected ? t('inspected') : t('notInspected')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
