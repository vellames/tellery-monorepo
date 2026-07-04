'use client';

import { useField } from 'formik';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormikFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: React.ReactNode;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
}

export function FormikField({
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  icon,
  onFocus,
}: FormikFieldProps) {
  const [field, meta] = useField(name);
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
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          className={cn(icon && 'pl-10')}
          {...field}
          onFocus={onFocus}
        />
      </div>
      {hasError && <p className="text-destructive text-sm">{meta.error}</p>}
    </div>
  );
}
