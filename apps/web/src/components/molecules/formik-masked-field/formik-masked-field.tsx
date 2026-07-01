'use client';

import { useField } from 'formik';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { MaskedInput } from '@/components/molecules/masked-input/masked-input';

interface FormikMaskedFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: React.ReactNode;
}

export function FormikMaskedField({
  name,
  label,
  placeholder,
  autoComplete,
  icon,
}: FormikMaskedFieldProps) {
  const [field, meta, helpers] = useField<string>(name);
  const hasError = Boolean(meta.touched && meta.error);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="font-semibold">
        {label}
      </Label>
      <div className="relative">
        {icon && (
          <span className="text-faint pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
            {icon}
          </span>
        )}
        <MaskedInput
          id={name}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          className={cn(icon && 'pl-10')}
          value={field.value ?? ''}
          onChange={(value) =>
            helpers.setValue(value.replace(/\D/g, '').slice(0, 11))
          }
          onBlur={field.onBlur}
        />
      </div>
      {hasError && <p className="text-destructive text-sm">{meta.error}</p>}
    </div>
  );
}
