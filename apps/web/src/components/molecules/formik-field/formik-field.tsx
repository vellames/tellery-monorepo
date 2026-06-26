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
}

export function FormikField({
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  icon,
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
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
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
        />
      </div>
      {hasError && <p className="text-sm text-destructive">{meta.error}</p>}
    </div>
  );
}
