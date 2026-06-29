'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Fingerprint, MapPin, MessageCircle, Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  InteractDiscoveredClue,
  InteractResult,
  SessionCharacter,
  SessionClue,
  SessionLocation,
  SessionMessage,
  SessionObject,
} from '@/lib/types/session';
import { CluePill } from './components/clue-pill';
import { ClueDiscoveryOverlay } from './components/clue-discovery-overlay';
import { InvestigationMessageList } from './components/investigation-message-list';
import { LocationObjectList } from './components/location-object-list';
import { ObjectInspectAction } from './components/object-inspect-action';
import { CharacterInteractionForm } from './components/character-interaction-form';

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
      ? ((target?.data as { messages?: unknown[] }).messages?.length ?? 0)
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
          <CluePill
            found={serverClues.length}
            total={target.data.cluesTotal}
            easyMode={easyMode}
            clues={serverClues}
            label={tp('cluesFoundHere')}
            emptyLabel={tp('noCluesFoundHere')}
            closeLabel={t('close')}
          />
        </div>

        {/* body */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-6">
          <p className="leading-7 text-[#fff9ef]/80 italic">{description}</p>

          <InvestigationMessageList
            messages={allMessages}
            isSending={isSending}
            isTranscribing={isTranscribing}
          />

          {error && (
            <p className="text-center text-sm text-[#e57373]">{error}</p>
          )}

          {kind === 'location' && (
            <LocationObjectList
              objects={locationObjects}
              easyMode={easyMode}
              onSelectObject={onSelectObject}
            />
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
          <ObjectInspectAction
            isSending={isSending}
            onInspect={() => void handleSend(tp('autoInspectLocation'))}
          />
        )}

        {kind === 'character' && (
          <CharacterInteractionForm
            value={input}
            onChange={setInput}
            isSending={isSending}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            name={name}
            onSubmit={() => void handleSend()}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
          />
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
