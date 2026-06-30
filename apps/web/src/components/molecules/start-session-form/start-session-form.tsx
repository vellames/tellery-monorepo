'use client';

import { useEffect, useActionState } from 'react';
import { toast } from 'sonner';
import { startSessionAction } from '@/lib/actions/session';
import { INITIAL_STATE } from '@/lib/actions/session-state';
import { StartSessionButton } from '../start-session-button/start-session-button';

export interface StartSessionFormProps {
  historyId: string;
}

export function StartSessionForm({ historyId }: StartSessionFormProps) {
  const [state, formAction] = useActionState(
    startSessionAction.bind(null, historyId),
    INITIAL_STATE
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={formAction}>
      <StartSessionButton />
    </form>
  );
}
