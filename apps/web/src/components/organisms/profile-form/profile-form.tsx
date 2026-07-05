'use client';

import { useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { IdCard, Loader2, Mail, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FormikField, FormikMaskedField } from '@/components/molecules';
import { useUpdateProfile } from '@/lib/hooks/use-profile';
import type { UpdateProfilePayload } from '@/lib/types/auth';
import type { User } from '@/lib/types/auth';

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const updateProfile = useUpdateProfile();
  const t = useTranslations('profile');

  const initialValues: UpdateProfilePayload = {
    name: user.name,
    email: user.email ?? '',
    ssn: user.ssn ?? '',
  };

  const profileSchema = useMemo(
    () =>
      yup.object({
        name: yup.string().required(t('errors.nameRequired')),
        email: yup
          .string()
          .email(t('errors.invalidEmail'))
          .required(t('errors.emailRequired')),
        ssn: yup.string().nullable(),
      }),
    [t]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={profileSchema}
      enableReinitialize
      onSubmit={(values, { setSubmitting }) => {
        updateProfile.mutate(values, {
          onSettled: () => setSubmitting(false),
        });
      }}
    >
      <Form className="space-y-4">
        <FormikField
          name="name"
          label={t('name')}
          placeholder={t('namePlaceholder')}
          autoComplete="name"
          icon={<UserRound className="size-4" />}
        />
        <FormikField
          name="email"
          type="email"
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          icon={<Mail className="size-4" />}
        />
        <FormikMaskedField
          name="ssn"
          label={t('ssn')}
          placeholder={t('ssnPlaceholder')}
          autoComplete="off"
          icon={<IdCard className="size-4" />}
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base font-semibold"
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {t('submit')}
        </Button>
      </Form>
    </Formik>
  );
}
