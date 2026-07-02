'use client';

import { Sparkles, Target } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

export interface CaseModalProps {
  opening: string;
  objective: string;
  briefingLabel: string;
  objectiveLabel: string;
  closeLabel: string;
  onClose: () => void;
}

export function CaseModal({
  opening,
  objective,
  briefingLabel,
  objectiveLabel,
  closeLabel,
  onClose,
}: CaseModalProps) {
  return (
    <Modal
      variant="scene"
      open
      onClose={onClose}
      closeLabel={closeLabel}
      ariaLabel={briefingLabel}
      className="flex h-[85svh] flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 sm:p-8">
        <section>
          <h2 className="text-gold mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] uppercase">
            <Sparkles className="size-3.5" />
            {briefingLabel}
          </h2>
          <p className="font-heading text-lg leading-8 text-[#fff9ef]/85 italic sm:text-xl sm:leading-9">
            {opening}
          </p>
        </section>

        <div className="border-gold/25 relative rounded-2xl border bg-gradient-to-br from-[#4a111b]/60 to-[#120406]/30 p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <div className="border-gold/40 text-gold grid size-10 shrink-0 place-items-center rounded-xl border bg-black/25">
              <Target className="size-5" />
            </div>
            <div>
              <h3 className="text-gold text-xs font-bold tracking-[0.16em] uppercase">
                {objectiveLabel}
              </h3>
              <p className="mt-1.5 leading-7 text-[#fff9ef]/90">
                {objective}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
