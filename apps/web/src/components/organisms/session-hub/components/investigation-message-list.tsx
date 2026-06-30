'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionMessage } from '@/lib/types/session';

const USER_ROLE = 'user';

export interface InvestigationMessageListProps {
  messages: SessionMessage[];
  isSending: boolean;
  isTranscribing: boolean;
}

export function InvestigationMessageList({
  messages,
  isSending,
  isTranscribing,
}: InvestigationMessageListProps) {
  if (messages.length === 0 && !isSending && !isTranscribing) return null;

  return (
    <div className="flex flex-col gap-3">
      {messages.map((m, i) => {
        const isUser = m.role === USER_ROLE;
        const isSystem = m.role === 'system';
        if (isSystem) {
          return (
            <div key={i} className="flex justify-center">
              <details className="group w-full rounded-xl border border-[#fff9ef]/10 bg-[#fff9ef]/[0.03] px-3 py-2 text-xs leading-5 text-[#fff9ef]/55">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[#fff9ef]/45 transition-colors hover:text-[#fff9ef]/70 [&::-webkit-details-marker]:hidden">
                  <Search className="size-3" />
                  <span>system prompt</span>
                  <span className="ml-auto text-[10px] tracking-[0.18em] text-[#fff9ef]/30 uppercase group-open:hidden">
                    abrir
                  </span>
                  <span className="ml-auto hidden text-[10px] tracking-[0.18em] text-[#fff9ef]/30 uppercase group-open:inline">
                    fechar
                  </span>
                </summary>
                <pre className="mt-2 max-h-[420px] overflow-auto rounded-lg bg-black/20 p-3 font-mono text-[11px] leading-5 break-words whitespace-pre-wrap text-[#fff9ef]/70">
                  {m.content}
                </pre>
              </details>
            </div>
          );
        }
        return (
          <div
            key={i}
            className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
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
  );
}
