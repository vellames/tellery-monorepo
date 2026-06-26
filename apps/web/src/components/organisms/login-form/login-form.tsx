'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FormikField } from '@/components/molecules';
import { useLogin } from '@/lib/hooks/use-auth';
import { config } from '@/lib/config';
import type { LoginFormValues } from '@/lib/validations/auth';

const initialValues: LoginFormValues = { email: '', password: '' };

export function LoginForm() {
  const login = useLogin();
  const t = useTranslations('auth');

  const loginSchema = useMemo(
    () =>
      yup.object({
        email: yup
          .string()
          .email(t('errors.invalidEmail'))
          .required(t('errors.emailRequired')),
        password: yup.string().required(t('errors.passwordRequired')),
      }),
    [t]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={loginSchema}
      onSubmit={(values, { setSubmitting }) => {
        login.mutate(values, {
          onSettled: () => setSubmitting(false),
        });
      }}
    >
      <Form className="space-y-4">
        <FormikField
          name="email"
          label={t('email')}
          type="email"
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          icon={<Mail className="size-4" />}
        />
        <FormikField
          name="password"
          label={t('password')}
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          icon={<Lock className="size-4" />}
        />
        <div className="flex justify-end">
          <Link
            href={config.routes.forgotPassword}
            className="text-muted-foreground hover:text-primary text-sm underline"
          >
            {t('forgotPassword')}
          </Link>
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base font-semibold"
          disabled={login.isPending}
        >
          {login.isPending && <Loader2 className="size-4 animate-spin" />}
          {t('submit')}
        </Button>
      </Form>
    </Formik>
  );
}
