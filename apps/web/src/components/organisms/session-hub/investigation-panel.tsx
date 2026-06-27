'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import {
  Fingerprint,
  KeyRound,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type {
  SessionCharacter,
  SessionClue,
  SessionLocation,
  SessionMessage,
  SessionObject,
} from '@/lib/types/session';

export type InvestigationTarget =
  | { kind: 'character'; data: SessionCharacter }
  | { kind: 'object'; data: SessionObject }
  | { kind: 'location'; data: SessionLocation };

const USER_ROLE = 'user';

const KIND_META = {
  character: { icon: MessageCircle, labelKey: 'interrogate' as const },
  object: { icon: Fingerprint, labelKey: 'inspect' as const },
  location: { icon: MapPin, labelKey: 'explore' as const },
};

export interface InvestigationPanelProps {
  target: InvestigationTarget | null;
  onClose: () => void;
}

export function InvestigationPanel({
  target,
  onClose,
}: InvestigationPanelProps) {
  const t = useTranslations('play');
  const tp = useTranslations('play.panel');

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [target, onClose]);

  if (!target) return null;

  const { kind } = target;
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  const name = target.data.name;
  const imageUrl = target.data.imageUrl;
  const role = kind === 'character' ? target.data.role : undefined;
  const description =
    kind === 'character'
      ? target.data.shortDescription
      : target.data.initialDescription;
  const clues: SessionClue[] = target.data.discoveredClues;
  const messages: SessionMessage[] =
    kind === 'location' ? [] : target.data.messages;

  const placeholderKey =
    kind === 'character'
      ? 'askPlaceholder'
      : kind === 'object'
        ? 'inspectPlaceholder'
        : 'explorePlaceholder';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${tp(meta.labelKey)} — ${name}`}
    >
      <button
        type="button"
        aria-label={t('close')}
        onClick={onClose}
        style={{ animation: 'scene-fade-in 0.25s ease forwards' }}
        className="absolute inset-0 cursor-default bg-[#0a0203]/80 backdrop-blur-sm"
      />

      <div
        className="scene-grain relative flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-[#fff9ef]/12 bg-[#1b070b] shadow-2xl sm:max-h-[88svh] sm:rounded-[28px]"
        style={{ animation: 'scene-fade-up 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* hero */}
        <div className="relative h-44 shrink-0 sm:h-52">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="640px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] via-[#160a08] to-[#6e3d15]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b070b] via-[#1b070b]/30 to-transparent" />

          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full border border-[#fff9ef]/15 bg-black/40 text-[#fff9ef]/80 backdrop-blur transition hover:bg-black/60 hover:text-[#fff9ef]"
          >
            <X className="size-4" />
          </button>

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <span className="text-gold mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase">
              <Icon className="size-3.5" />
              {tp(meta.labelKey)}
            </span>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#fff9ef] sm:text-3xl">
              {name}
            </h2>
            {role && (
              <p className="text-gold/90 text-xs font-semibold tracking-wide uppercase">
                {role}
              </p>
            )}
          </div>
        </div>

        {/* body */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-6">
          <p className="leading-7 text-[#fff9ef]/80 italic">{description}</p>

          {messages.length > 0 && (
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => {
                const isUser = m.role === USER_ROLE;
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex',
                      isUser ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6',
                        isUser
                          ? 'bg-gold/90 text-gold-foreground rounded-br-md'
                          : 'rounded-bl-md bg-[#fff9ef]/[0.07] text-[#fff9ef]/90'
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {clues.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-gold inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase">
                <KeyRound className="size-3.5" />
                {tp('cluesFoundHere')}
              </h3>
              {clues.map((clue) => (
                <div
                  key={clue.id}
                  className="border-clue-border/25 relative overflow-hidden rounded-xl border bg-[#fff4d8]/[0.05] p-3.5 pl-4"
                >
                  <div className="bg-gold absolute top-0 left-0 h-full w-1" />
                  <h4 className="font-heading text-base font-semibold text-[#fff9ef]">
                    {clue.title}
                  </h4>
                  <p className="mt-0.5 text-sm leading-6 text-[#fff9ef]/65">
                    {clue.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {messages.length === 0 && clues.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#fff9ef]/12 bg-[#fff9ef]/[0.02] px-5 py-7 text-center">
              <Sparkles className="mx-auto size-6 text-[#fff9ef]/25" />
              <p className="mt-2 text-sm text-[#fff9ef]/45">
                {tp('noCluesHere')}
              </p>
            </div>
          )}
        </div>

        {/* input (prepared for /interact wiring) */}
        <div className="shrink-0 border-t border-[#fff9ef]/10 bg-[#150508] p-3 sm:p-4">
          <div className="flex items-center gap-2 rounded-2xl border border-[#fff9ef]/12 bg-[#fff9ef]/[0.04] px-3 py-1.5 opacity-60">
            <input
              disabled
              placeholder={tp(placeholderKey, { name })}
              className="flex-1 bg-transparent py-2 text-sm text-[#fff9ef] placeholder:text-[#fff9ef]/40 focus:outline-none"
            />
            <button
              type="button"
              disabled
              aria-label={tp('send')}
              className="text-gold-foreground grid size-9 shrink-0 cursor-not-allowed place-items-center rounded-xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7]"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] tracking-wide text-[#fff9ef]/35">
            {tp('comingSoon')}
          </p>
        </div>
      </div>
    </div>
  );
}
