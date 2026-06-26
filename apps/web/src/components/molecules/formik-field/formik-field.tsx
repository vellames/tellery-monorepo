'use client';

import { useField } from 'formik';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormikFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}

export function FormikField({
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
}: FormikFieldProps) {
  const [field, meta] = useField(name);
  const hasError = Boolean(meta.touched && meta.error);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={hasError}
        {...field}
      />
      {hasError && <p className="text-sm text-destructive">{meta.error}</p>}
    </div>
  );
}
