'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Fingerprint,
  KeyRound,
  MapPin,
  MessageCircle,
  Mic,
  Loader2,
  Search,
  Send,
  Sparkles,
  Square,
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
  easyMode: boolean;
  onSelectObject: (object: SessionObject) => void;
  onInteracted: () => void;
  onClose: () => void;
}

export function InvestigationPanel({
  sessionId,
  target,
  objects,
  easyMode,
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const dataRef = useRef<unknown>(target?.data);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          const reply = result.reply;
          const replyRole =
            target.kind === 'character' ? 'character' : 'object';
          setExtraMessages((prev) => [
            ...prev,
            {
              role: replyRole,
              content: reply,
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

  const handleSendAudio = useCallback(async () => {
    if (!target || audioChunksRef.current.length === 0) return;

    const stateId = target.data.id;
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('stateId', stateId);

    setError(null);
    setIsTranscribing(true);
    setIsSending(true);

    try {
      const res = await fetch(`/api/session/${sessionId}/interact`, {
        method: 'POST',
        body: formData,
      });

      const body = (await res.json().catch(() => null)) as
        | (InteractResult & { error?: string })
        | null;

      setIsTranscribing(false);

      if (!res.ok || !body || body.error) {
        throw new Error(body?.error ?? tp('interactError'));
      }

      const result: InteractResult = body;

      if (result.reply) {
        const reply = result.reply;
        const replyRole = target.kind === 'character' ? 'character' : 'object';
        setExtraMessages((prev) => [
          ...prev,
          {
            role: replyRole,
            content: reply,
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
      setError(tp('audioError'));
    } finally {
      setIsSending(false);
      setIsTranscribing(false);
      audioChunksRef.current = [];
    }
  }, [target, sessionId, onInteracted, tp]);

  const handleStartRecording = useCallback(async () => {
    if (!target || isRecording || isSending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void handleSendAudio();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setError(tp('audioError'));
    }
  }, [target, isRecording, isSending, tp, handleSendAudio]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

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

  const messageCount =
    ('messages' in (target?.data ?? {})
      ? (target?.data as { messages?: unknown[] }).messages?.length ?? 0
      : 0) + extraMessages.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messageCount, isSending, isTranscribing]);

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
        className="scene-grain relative flex h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-[#fff9ef]/12 bg-[#1b070b] shadow-2xl sm:rounded-[28px]"
        style={{ animation: 'scene-fade-up 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* hero */}
        <div className="relative h-40 shrink-0 sm:h-44">
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover brightness-[0.6]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#37050d] via-[#160a08] to-[#6e3d15]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b070b] via-[#1b070b]/60 to-[#1b070b]/20" />

          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full border border-[#fff9ef]/15 bg-black/40 text-[#fff9ef]/80 backdrop-blur transition hover:bg-black/60 hover:text-[#fff9ef]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* portrait + title (overlapping hero) */}
        <div className="relative z-10 -mt-12 flex items-end gap-4 px-5 sm:px-6">
          {imageUrl ? (
            <div className="border-gold/30 size-24 shrink-0 overflow-hidden rounded-2xl border-2 shadow-xl sm:size-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="border-gold/30 grid size-24 shrink-0 place-items-center rounded-2xl border-2 bg-gradient-to-br from-[#37050d] to-[#160a08] shadow-xl sm:size-28">
              <Icon className="text-gold/50 size-8" />
            </div>
          )}
          <div className="min-w-0 flex-1 pb-1">
            <span className="text-gold mb-0.5 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase">
              <Icon className="size-3.5" />
              {tp(meta.labelKey)}
            </span>
            <h2 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-[#fff9ef] sm:text-3xl">
              {name}
            </h2>
            {role && (
              <p className="text-gold/90 text-xs font-semibold tracking-wide uppercase">
                {role}
              </p>
            )}
          </div>
          {serverClues.length > 0 && (
            <CluePill
              found={serverClues.length}
              total={target.data.cluesTotal}
              easyMode={easyMode}
              clues={serverClues}
              label={tp('cluesFoundHere')}
            />
          )}
        </div>

        {/* body */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-6">
          <p className="leading-7 text-[#fff9ef]/80 italic">{description}</p>

          {allMessages.length > 0 && (
            <div className="flex flex-col gap-3">
              {allMessages.map((m, i) => {
                const isUser = m.role === USER_ROLE;
                const isSystem = m.role === 'system';
                if (isSystem) {
                  return (
                    <div key={i} className="flex justify-center">
                      <details className="group w-full rounded-xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] px-3 py-2 text-xs leading-5 text-[#fff9ef]/55">
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[#fff9ef]/45 transition-colors hover:text-[#fff9ef]/70 [&::-webkit-details-marker]:hidden">
                          <Search className="size-3" />
                          <span>system prompt</span>
                          <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-[#fff9ef]/30 group-open:hidden">
                            abrir
                          </span>
                          <span className="ml-auto hidden text-[10px] uppercase tracking-[0.18em] text-[#fff9ef]/30 group-open:inline">
                            fechar
                          </span>
                        </summary>
                        <pre className="mt-2 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/20 p-3 font-mono text-[11px] leading-5 text-[#fff9ef]/70">
                          {m.content}
                        </pre>
                      </details>
                    </div>
                  );
                }
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
                    {isTranscribing && (
                      <span className="mr-1 text-xs text-[#fff9ef]/45">
                        {tp('recording')}
                      </span>
                    )}
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

          {isTranscribing && !allMessages.length && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-[#fff9ef]/[0.07] px-4 py-3 text-xs text-[#fff9ef]/45">
                <Mic className="size-3.5 animate-pulse" />
                {tp('recording')}
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-[#e57373]">{error}</p>
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
          <div ref={messagesEndRef} />
        </div>

        {/* input — hidden for locations (auto-inspected on open) */}
        {kind === 'object' && (
          <div className="shrink-0 border-t border-[#fff9ef]/10 bg-[#150508] p-3 sm:p-4">
            <button
              type="button"
              onClick={() => void handleSend(tp('autoInspectLocation'))}
              disabled={isSending}
              className="text-gold-foreground shadow-button flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-4 text-base font-bold transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSending ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {tp('sending')}
                </>
              ) : (
                <>
                  <Search className="size-5" />
                  {tp('inspect')}
                </>
              )}
            </button>
          </div>
        )}

        {kind === 'character' && (
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
                disabled={isSending || isRecording}
                placeholder={
                  isRecording ? tp('recording') : tp(placeholderKey, { name })
                }
                className="flex-1 bg-transparent py-2 text-sm text-[#fff9ef] placeholder:text-[#fff9ef]/40 focus:outline-none disabled:opacity-50"
              />
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  aria-label={tp('recording')}
                  className="grid size-9 shrink-0 animate-pulse cursor-pointer place-items-center rounded-xl bg-[#e57373]/20 text-[#e57373] ring-1 ring-[#e57373]/30 transition"
                >
                  <Square className="size-4" />
                </button>
              ) : isTranscribing ? (
                <div className="text-gold/70 grid size-9 shrink-0 place-items-center rounded-xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.04]">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isSending}
                  aria-label={tp('tapToRecord')}
                  className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.04] text-[#fff9ef]/60 transition hover:text-[#fff9ef] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Mic className="size-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isSending || isRecording || !input.trim()}
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
    <div className="absolute inset-0 isolate z-30 flex items-center justify-center overflow-hidden bg-[#0a0203]/88 p-4 backdrop-blur-xl sm:p-6">
      <div className="scene-clue-aura pointer-events-none absolute inset-0" />
      <div className="scene-clue-flash pointer-events-none absolute inset-0" />
      <div className="scene-clue-sweep pointer-events-none absolute" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="scene-clue-particle" />
        ))}
      </div>

      <div className="scene-clue-card relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-[#f4d78f]/25 bg-[#160508]/92 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.58),0_0_70px_rgba(196,154,74,0.16)] backdrop-blur-2xl sm:p-6">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#f9e8b7]/80 to-transparent" />
        <div className="pointer-events-none absolute -top-24 right-8 h-48 w-48 rounded-full bg-[#f4d78f]/10 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="scene-clue-seal grid size-14 shrink-0 place-items-center rounded-2xl border border-[#f4d78f]/30 bg-gradient-to-br from-[#f9e8b7] to-[#c49a4a] text-[#32160a] shadow-[0_14px_40px_rgba(196,154,74,0.28)]">
            <KeyRound className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="text-gold flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase">
              <Sparkles className="size-3.5" />
              {heading}
            </div>
            <div className="mt-2 h-px w-24 bg-gradient-to-r from-[#f4d78f]/70 to-transparent" />
          </div>
        </div>

        <div className="relative mt-5 flex max-h-[42svh] flex-col gap-3 overflow-y-auto pr-1">
          {clues.map((clue, i) => (
            <div
              key={clue.id}
              className="scene-clue-item group relative overflow-hidden rounded-2xl border border-[#fff9ef]/12 bg-[#fff9ef]/[0.055] p-4 transition hover:border-[#f4d78f]/35 hover:bg-[#fff9ef]/[0.075]"
              style={{ animationDelay: `${0.18 + i * 0.12}s` }}
            >
              <div className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-[#f9e8b7] via-[#f4d78f] to-[#9a6b2f]" />
              <h3 className="font-heading text-xl leading-tight font-semibold text-[#fff9ef]">
                {clue.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#fff9ef]/68">
                {clue.description}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="text-gold-foreground mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-3.5 text-sm font-bold shadow-[0_16px_36px_rgba(196,154,74,0.22)] transition hover:scale-[1.01] hover:shadow-[0_18px_42px_rgba(196,154,74,0.3)]"
        >
          {continueLabel}
          <Sparkles className="size-4" />
        </button>
      </div>
    </div>
  );
}

function CluePill({
  found,
  total,
  easyMode,
  clues,
  label,
}: {
  found: number;
  total: number;
  easyMode: boolean;
  clues: SessionClue[];
  label: string;
}) {
  const pct = total > 0 ? Math.round((found / total) * 100) : 0;

  return (
    <div className="group/pill relative shrink-0">
      <div className="flex items-center gap-2 rounded-full border border-[#fff9ef]/15 bg-black/40 px-3 py-1.5 backdrop-blur">
        <KeyRound className="text-gold size-3.5" />
        {easyMode ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#fff9ef]/80">
              {found}/{total}
            </span>
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#fff9ef]/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c49a4a] to-[#f4d78f]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-[11px] font-bold text-[#fff9ef]/80">
            {found}
          </span>
        )}
      </div>

      <div className="pointer-events-none absolute top-full right-0 z-20 mt-2 w-64 origin-top-right translate-y-1 opacity-0 transition-all duration-200 group-hover/pill:pointer-events-auto group-hover/pill:translate-y-0 group-hover/pill:opacity-100">
        <div className="flex flex-col gap-2 rounded-2xl border border-[#fff9ef]/12 bg-[#0a0203]/95 p-3 shadow-2xl backdrop-blur">
          <span className="text-gold text-[10px] font-bold tracking-[0.12em] uppercase">
            {label}
          </span>
          {clues.map((clue) => (
            <div
              key={clue.id}
              className="border-clue-border/20 relative overflow-hidden rounded-lg border bg-[#fff4d8]/[0.05] p-2.5 pl-3.5"
            >
              <div className="bg-gold absolute top-0 left-0 h-full w-1" />
              <h4 className="text-sm font-semibold text-[#fff9ef]">
                {clue.title}
              </h4>
              <p className="mt-0.5 text-xs leading-5 text-[#fff9ef]/60">
                {clue.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
