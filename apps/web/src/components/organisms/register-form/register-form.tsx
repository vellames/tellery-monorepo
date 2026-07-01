'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CheckboxField, FormikField } from '@/components/molecules';
import { useRegister } from '@/lib/hooks/use-auth';
import { config } from '@/lib/config';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  privacy: boolean;
}

const initialValues: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: false,
  privacy: false,
};

export function RegisterForm() {
  const register = useRegister();
  const t = useTranslations('register');
  const tCommon = useTranslations('common');

  const schema = useMemo(
    () =>
      yup.object({
        name: yup
          .string()
          .min(2, t('errors.nameMin'))
          .required(t('errors.nameRequired')),
        email: yup
          .string()
          .email(t('errors.invalidEmail'))
          .required(t('errors.emailRequired')),
        password: yup
          .string()
          .min(6, t('errors.passwordMin'))
          .required(t('errors.passwordRequired')),
        confirmPassword: yup
          .string()
          .oneOf([yup.ref('password')], t('errors.passwordMismatch'))
          .required(t('errors.passwordRequired')),
        terms: yup.boolean().oneOf([true], t('errors.termsRequired')),
        privacy: yup.boolean().oneOf([true], t('errors.privacyRequired')),
      }),
    [t]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={(values, { setSubmitting }) => {
        register.mutate(
          {
            name: values.name,
            email: values.email,
            password: values.password,
          },
          { onSettled: () => setSubmitting(false) }
        );
      }}
    >
      {() => (
        <Form className="space-y-4">
          <FormikField
            name="name"
            label={t('name')}
            autoComplete="name"
            icon={<User className="size-4" />}
          />
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
            autoComplete="new-password"
            icon={<Lock className="size-4" />}
          />
          <FormikField
            name="confirmPassword"
            label={t('confirmPassword')}
            type="password"
            autoComplete="new-password"
            icon={<Lock className="size-4" />}
          />
          <CheckboxField
            name="terms"
            label={
              <>
                {t('termsPrefix')}
                <Link
                  href={config.routes.terms}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {t('termsOfUse')}
                </Link>
              </>
            }
          />
          <CheckboxField
            name="privacy"
            label={
              <>
                {t('privacyPrefix')}
                <Link
                  href={config.routes.privacy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {t('privacyPolicy')}
                </Link>
              </>
            }
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full text-base font-semibold"
            disabled={register.isPending}
          >
            {register.isPending && <Loader2 className="size-4 animate-spin" />}
            {t('submit')}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            nativeButton={false}
            render={<Link href={config.routes.login} />}
          >
            {tCommon('backToLogin')}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
