'use client';

import { useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { Loader2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FormikField } from '@/components/molecules';
import { useChangePassword } from '@/lib/hooks/use-profile';

const initialValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const t = useTranslations('profile.password');

  const schema = useMemo(
    () =>
      yup.object({
        currentPassword: yup.string().required(t('errors.currentRequired')),
        newPassword: yup
          .string()
          .min(6, t('errors.newMin'))
          .test(
            'not-same-as-current',
            t('errors.sameAsCurrent'),
            (value, ctx) => value !== ctx.parent.currentPassword
          ),
        confirmPassword: yup
          .string()
          .oneOf([yup.ref('newPassword')], t('errors.mismatch')),
      }),
    [t]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={(values, { setSubmitting, resetForm }) => {
        changePassword.mutate(
          {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          },
          {
            onSuccess: () => resetForm(),
            onSettled: () => setSubmitting(false),
          }
        );
      }}
    >
      <Form className="space-y-4">
        <FormikField
          name="currentPassword"
          type="password"
          label={t('current')}
          placeholder={t('currentPlaceholder')}
          autoComplete="current-password"
          icon={<Lock className="size-4" />}
        />
        <FormikField
          name="newPassword"
          type="password"
          label={t('new')}
          placeholder={t('newPlaceholder')}
          autoComplete="new-password"
          icon={<Lock className="size-4" />}
        />
        <FormikField
          name="confirmPassword"
          type="password"
          label={t('confirm')}
          placeholder={t('confirmPlaceholder')}
          autoComplete="new-password"
          icon={<Lock className="size-4" />}
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base font-semibold"
          disabled={changePassword.isPending}
        >
          {changePassword.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {t('submit')}
        </Button>
      </Form>
    </Formik>
  );
}
