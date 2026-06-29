import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { CharacterInteractionForm } from '@/components/organisms/session-hub/components/character-interaction-form';
import { renderWithProviders } from '@/test-utils';

function TestForm({ onSubmit }: { onSubmit: () => void }) {
  const [value, setValue] = useState('');
  return (
    <CharacterInteractionForm
      value={value}
      onChange={setValue}
      isSending={false}
      isRecording={false}
      isTranscribing={false}
      name="Elisa"
      onSubmit={onSubmit}
      onStartRecording={vi.fn()}
      onStopRecording={vi.fn()}
    />
  );
}

describe('CharacterInteractionForm', () => {
  it('renders the input with the name placeholder', () => {
    renderWithProviders(<TestForm onSubmit={vi.fn()} />);

    expect(
      screen.getByPlaceholderText('Pergunte algo a Elisa…')
    ).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    renderWithProviders(<TestForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Enviar')).toBeDisabled();
  });

  it('calls onSubmit when typing and pressing submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<TestForm onSubmit={onSubmit} />);

    await user.type(
      screen.getByPlaceholderText('Pergunte algo a Elisa…'),
      'Oi'
    );
    await user.click(screen.getByLabelText('Enviar'));

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
