'use client';

import { useStartSession } from '@/lib/hooks/use-start-session';
import { StartSessionButton } from '../start-session-button/start-session-button';

export interface StartSessionFormProps {
  historyId: string;
}

export function StartSessionForm({ historyId }: StartSessionFormProps) {
  const startSession = useStartSession();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startSession.mutate(historyId);
      }}
    >
      <StartSessionButton pending={startSession.isPending} />
    </form>
  );
}
