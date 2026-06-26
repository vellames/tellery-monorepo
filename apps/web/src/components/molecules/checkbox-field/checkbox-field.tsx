'use client';

import { useField } from 'formik';
import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxFieldProps {
  name: string;
  label: React.ReactNode;
}

export function CheckboxField({ name, label }: CheckboxFieldProps) {
  const [, meta, helpers] = useField<boolean>(name);
  const hasError = Boolean(meta.touched && meta.error);

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2.5">
        <Checkbox
          id={name}
          checked={meta.value ?? false}
          onCheckedChange={(v) => helpers.setValue(Boolean(v))}
          onBlur={() => helpers.setTouched(true)}
          aria-invalid={hasError}
          className="mt-0.5"
        />
        <label
          htmlFor={name}
          className="text-muted-foreground cursor-pointer text-sm leading-snug select-none"
        >
          {label}
        </label>
      </div>
      {hasError && (
        <p className="text-destructive pl-7 text-sm">{meta.error}</p>
      )}
    </div>
  );
}
