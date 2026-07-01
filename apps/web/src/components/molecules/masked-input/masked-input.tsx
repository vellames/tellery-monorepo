'use client';

import { Input } from '@/components/ui/input';

const CPF_MAX_DIGITS = 11;

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, CPF_MAX_DIGITS);
  const parts: string[] = [];

  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 9));

  const body = parts.join('.');
  if (digits.length <= 9) return body;

  return `${body}-${digits.slice(9)}`;
}

interface MaskedInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  'aria-invalid'?: boolean;
  className?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export function MaskedInput({
  value,
  onChange,
  id,
  name,
  placeholder,
  autoComplete,
  className,
  onBlur,
  ...rest
}: MaskedInputProps) {
  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={className}
      value={formatCpf(value)}
      onChange={(e) => onChange(formatCpf(e.target.value))}
      onBlur={onBlur}
      {...rest}
    />
  );
}
