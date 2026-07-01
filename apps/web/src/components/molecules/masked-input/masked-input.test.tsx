import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaskedInput,
  formatCpf,
} from '@/components/molecules/masked-input/masked-input';

function MaskedInputHarness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MaskedInput value={value} onChange={setValue} aria-label="CPF" />;
}

describe('formatCpf', () => {
  it('returns empty string for empty input', () => {
    expect(formatCpf('')).toBe('');
  });

  it('strips non-digit characters', () => {
    expect(formatCpf('abc123')).toBe('123');
  });

  it('keeps only the first 11 digits', () => {
    expect(formatCpf('12345678901234')).toBe('123.456.789-01');
  });

  it('does not insert separators below 4 digits', () => {
    expect(formatCpf('123')).toBe('123');
  });

  it('inserts the first dot after 3 digits', () => {
    expect(formatCpf('1234')).toBe('123.4');
  });

  it('inserts the second dot after 6 digits', () => {
    expect(formatCpf('1234567')).toBe('123.456.7');
  });

  it('inserts the dash after 9 digits', () => {
    expect(formatCpf('1234567890')).toBe('123.456.789-0');
  });

  it('formats a complete 11-digit cpf', () => {
    expect(formatCpf('29537995593')).toBe('295.379.955-93');
  });

  it('accepts an already-masked value and reformats it', () => {
    expect(formatCpf('295.379.955-93')).toBe('295.379.955-93');
  });
});

describe('MaskedInput', () => {
  it('displays a raw prefilled value as masked', () => {
    render(
      <MaskedInput
        value="29537995593"
        onChange={() => {}}
        aria-label="CPF"
      />
    );

    expect(screen.getByLabelText('CPF')).toHaveValue('295.379.955-93');
  });

  it('masks digits while typing', async () => {
    const user = userEvent.setup();
    render(<MaskedInputHarness />);

    await user.type(screen.getByLabelText('CPF'), '12345678901');

    expect(screen.getByLabelText('CPF')).toHaveValue('123.456.789-01');
  });

  it('strips letters while typing', async () => {
    const user = userEvent.setup();
    render(<MaskedInputHarness />);

    await user.type(screen.getByLabelText('CPF'), '12a34b56');

    expect(screen.getByLabelText('CPF')).toHaveValue('123.456');
  });
});
