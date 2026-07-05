'use client';

import { useStartSession } from '@/lib/hooks/use-start-session';
import { StartSessionButton } from '../start-session-button/start-session-button';

export interface StartSessionFormProps {
  storyId: string;
}

export function StartSessionForm({ storyId }: StartSessionFormProps) {
  const startSession = useStartSession();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startSession.mutate(storyId);
      }}
    >
      <StartSessionButton pending={startSession.isPending} />
    </form>
  );
}
