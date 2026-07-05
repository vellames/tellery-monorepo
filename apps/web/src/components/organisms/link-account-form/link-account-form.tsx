'use client';

import { useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FormikField } from '@/components/molecules';
import { useConvertAccount } from '@/lib/hooks/use-auth';

interface LinkAccountFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialValues: LinkAccountFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function LinkAccountForm() {
  const convertAccount = useConvertAccount();
  const t = useTranslations('convertAccount');

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
      }),
    [t]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={(values, { setSubmitting }) => {
        convertAccount.mutate(
          {
            name: values.name,
            email: values.email,
            password: values.password,
          },
          { onSettled: () => setSubmitting(false) }
        );
      }}
    >
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
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base font-semibold"
          disabled={convertAccount.isPending}
        >
          {convertAccount.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {convertAccount.isPending ? t('submitting') : t('submit')}
        </Button>
      </Form>
    </Formik>
  );
}
