import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { InvestigationMessageList } from '@/components/organisms/session-hub/components/investigation-message-list';
import { renderWithProviders } from '@/test-utils';
import type { SessionMessage } from '@/lib/types/session';

describe('InvestigationMessageList', () => {
  it('renders user and character messages', () => {
    const messages: SessionMessage[] = [
      {
        role: 'user',
        content: 'O que você viu?',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        role: 'character',
        content: 'Eu vi uma sombra.',
        createdAt: '2026-01-01T00:00:01.000Z',
      },
    ];

    renderWithProviders(
      <InvestigationMessageList
        messages={messages}
        isSending={false}
        isTranscribing={false}
      />
    );

    expect(screen.getByText('O que você viu?')).toBeInTheDocument();
    expect(screen.getByText('Eu vi uma sombra.')).toBeInTheDocument();
  });

  it('renders nothing when there are no messages and not sending', () => {
    const { container } = renderWithProviders(
      <InvestigationMessageList
        messages={[]}
        isSending={false}
        isTranscribing={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows typing dots when sending', () => {
    const messages: SessionMessage[] = [
      { role: 'user', content: 'Oi', createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    const { container } = renderWithProviders(
      <InvestigationMessageList
        messages={messages}
        isSending
        isTranscribing={false}
      />
    );

    const dots = container.querySelectorAll('.scene-typing-dot');
    expect(dots).toHaveLength(3);
  });

  it('shows only typing dots while sending transcribed audio', () => {
    const { container } = renderWithProviders(
      <InvestigationMessageList messages={[]} isSending isTranscribing />
    );

    const dots = container.querySelectorAll('.scene-typing-dot');
    expect(dots).toHaveLength(3);
    expect(screen.queryByText('Gravando…')).not.toBeInTheDocument();
  });
});
