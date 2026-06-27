'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Fingerprint,
  KeyRound,
  MapPin,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type {
  InteractDiscoveredClue,
  InteractResult,
  SessionCharacter,
  SessionClue,
  SessionLocation,
  SessionMessage,
  SessionObject,
} from '@/lib/types/session';

export type InvestigationTargetKind = 'character' | 'object' | 'location';

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
  sessionId: string;
  target: InvestigationTarget | null;
  objects: SessionObject[];
  onSelectObject: (object: SessionObject) => void;
  onInteracted: () => void;
  onClose: () => void;
}

export function InvestigationPanel({
  sessionId,
  target,
  objects,
  onSelectObject,
  onInteracted,
  onClose,
}: InvestigationPanelProps) {
  const t = useTranslations('play');
  const tp = useTranslations('play.panel');

  const [input, setInput] = useState('');
  const [extraMessages, setExtraMessages] = useState<SessionMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredClues, setDiscoveredClues] = useState<
    InteractDiscoveredClue[]
  >([]);
  const [showClueOverlay, setShowClueOverlay] = useState(false);

  const dataRef = useRef<unknown>(target?.data);

  const handleSend = useCallback(
    async (overrideInteraction?: string) => {
      const interaction = (overrideInteraction ?? input).trim();
      if (!target || !interaction || isSending) return;

      const stateId = target.data.id;

      if (!overrideInteraction) setInput('');
      setError(null);
      setIsSending(true);
      setExtraMessages((prev) => [
        ...prev,
        {
          role: USER_ROLE,
          content: interaction,
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const res = await fetch(`/api/session/${sessionId}/interact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stateId, interaction }),
        });

        const body = (await res.json().catch(() => null)) as
          | (InteractResult & { error?: string })
          | null;

        if (!res.ok || !body || body.error) {
          throw new Error(body?.error ?? tp('interactError'));
        }

        const result: InteractResult = body;

        if (result.reply) {
          const replyRole =
            target.kind === 'character' ? 'character' : 'object';
          setExtraMessages((prev) => [
            ...prev,
            {
              role: replyRole,
              content: result.reply!,
              createdAt: new Date().toISOString(),
            },
          ]);
        }

        if (result.discoveredClues.length > 0) {
          setDiscoveredClues(result.discoveredClues);
          setShowClueOverlay(true);
        } else {
          onInteracted();
        }
      } catch {
        setError(tp('interactError'));
        setExtraMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsSending(false);
      }
    },
    [target, input, isSending, sessionId, onInteracted, tp]
  );

  // Sync local state when server data changes (after refresh)
  useEffect(() => {
    if (target && dataRef.current !== target.data) {
      dataRef.current = target.data;
      setExtraMessages([]);
      setDiscoveredClues([]);
      setShowClueOverlay(false);
      setError(null);
    }
  }, [target]);

  // Auto-inspect a location on first open (when not yet visited)
  const autoInspectedRef = useRef(false);
  useEffect(() => {
    if (!target || target.kind !== 'location') return;
    if (target.data.visited) return;
    if (autoInspectedRef.current) return;
    autoInspectedRef.current = true;
    void handleSend(tp('autoInspectLocation'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Reset the auto-inspect guard when the panel closes
  useEffect(() => {
    if (!target) autoInspectedRef.current = false;
  }, [target]);

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

  const handleClueOverlayContinue = useCallback(() => {
    setShowClueOverlay(false);
    onInteracted();
  }, [onInteracted]);

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
  const serverClues: SessionClue[] = target.data.discoveredClues;
  const serverMessages: SessionMessage[] =
    kind === 'location' ? [] : target.data.messages;
  const allMessages = [...serverMessages, ...extraMessages];
  const locationObjects =
    kind === 'location'
      ? objects.filter((o) => o.locationId === target.data.id)
      : [];

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

          {allMessages.length > 0 && (
            <div className="flex flex-col gap-3">
              {allMessages.map((m, i) => {
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

              {isSending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-[#fff9ef]/[0.07] px-4 py-3">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="bg-gold/70 scene-typing-dot size-1.5 rounded-full"
                        style={{ animationDelay: `${dot * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-[#e57373]">{error}</p>
          )}

          {serverClues.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-gold inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase">
                <KeyRound className="size-3.5" />
                {tp('cluesFoundHere')}
              </h3>
              {serverClues.map((clue) => (
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

          {kind === 'location' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-gold inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase">
                <Search className="size-3.5" />
                {tp('objectsHere')}
              </h3>
              {locationObjects.length === 0 ? (
                <p className="text-sm text-[#fff9ef]/45">
                  {tp('noObjectsHere')}
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {locationObjects.map((object) => (
                    <button
                      key={object.id}
                      type="button"
                      onClick={() => onSelectObject(object)}
                      className="group hover:border-gold/40 flex cursor-pointer items-center gap-3.5 rounded-xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] p-3 text-left transition hover:bg-[#fff9ef]/[0.06]"
                    >
                      {object.imageUrl ? (
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={object.imageUrl}
                            alt={object.name}
                            fill
                            className="object-cover"
                            sizes="48px"
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
          )}

          {allMessages.length === 0 &&
            serverClues.length === 0 &&
            locationObjects.length === 0 &&
            !isSending && (
              <div className="rounded-2xl border border-dashed border-[#fff9ef]/12 bg-[#fff9ef]/[0.02] px-5 py-7 text-center">
                <Sparkles className="mx-auto size-6 text-[#fff9ef]/25" />
                <p className="mt-2 text-sm text-[#fff9ef]/45">
                  {tp('noCluesHere')}
                </p>
              </div>
            )}
        </div>

        {/* input — hidden for locations (auto-inspected on open) */}
        {kind !== 'location' && (
          <div className="shrink-0 border-t border-[#fff9ef]/10 bg-[#150508] p-3 sm:p-4">
            <form
              className="flex items-center gap-2 rounded-2xl border border-[#fff9ef]/12 bg-[#fff9ef]/[0.04] px-3 py-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSending}
                placeholder={tp(placeholderKey, { name })}
                className="flex-1 bg-transparent py-2 text-sm text-[#fff9ef] placeholder:text-[#fff9ef]/40 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label={tp('send')}
                className="text-gold-foreground grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Clue discovery overlay ─────────────────────────────────── */}
      {showClueOverlay && discoveredClues.length > 0 && (
        <ClueDiscoveryOverlay
          clues={discoveredClues}
          heading={
            discoveredClues.length === 1
              ? tp('clueDiscovered')
              : tp('clueDiscoveredPlural')
          }
          continueLabel={tp('continue')}
          onContinue={handleClueOverlayContinue}
        />
      )}
    </div>
  );
}

function ClueDiscoveryOverlay({
  clues,
  heading,
  continueLabel,
  onContinue,
}: {
  clues: InteractDiscoveredClue[];
  heading: string;
  continueLabel: string;
  onContinue: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-[#0a0203]/95 p-6 backdrop-blur-sm">
      <div className="scene-clue-flash bg-gold/30 pointer-events-none absolute inset-0" />

      <div className="relative flex flex-col items-center gap-5">
        <div className="text-gold flex items-center gap-2 text-sm font-bold tracking-[0.16em] uppercase">
          <KeyRound className="size-5" />
          {heading}
        </div>

        <div className="flex max-w-md flex-col gap-3">
          {clues.map((clue, i) => (
            <div
              key={clue.id}
              className="border-clue-border scene-clue-card scene-clue-glow relative overflow-hidden rounded-2xl border bg-[#1b070b]/95 p-5 pl-6"
              style={{ animationDelay: `${i * 0.25}s` }}
            >
              <div className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-[#f4d78f] to-[#c49a4a]" />
              <h3 className="font-heading text-xl font-semibold text-[#fff9ef]">
                {clue.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-[#fff9ef]/70">
                {clue.description}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="text-gold-foreground mt-2 cursor-pointer rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-3 text-sm font-bold transition hover:scale-[1.02]"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
