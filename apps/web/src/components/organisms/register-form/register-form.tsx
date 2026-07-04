'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Formik, Form, useFormikContext } from 'formik';
import * as yup from 'yup';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CheckboxField, FormikField } from '@/components/molecules';
import { useRegister } from '@/lib/hooks/use-auth';
import { useLeadTracking } from '@/lib/hooks/use-lead-tracking';
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

/**
 * Notifies the lead tracker of name/email changes. Lives inside <Formik> so it
 * can read the form values via context. The tracker debounces + diffs against
 * the server snapshot, so this only fires a PATCH when a value truly changed.
 */
function LeadFieldSync({
  onField,
}: {
  onField: (name: 'name' | 'email', value: string) => void;
}) {
  const { values } = useFormikContext<RegisterFormValues>();

  useEffect(() => {
    onField('name', values.name);
  }, [values.name, onField]);

  useEffect(() => {
    onField('email', values.email);
  }, [values.email, onField]);

  return null;
}

export function RegisterForm() {
  const register = useRegister();
  const t = useTranslations('register');
  const tCommon = useTranslations('common');

  const {
    setFieldValue: trackField,
    markFirstInputFocus,
    markPasswordTouched,
    markConfirmPasswordTouched,
    markPrivacyAccepted,
    markTermsAccepted,
    flushAndReturnLeadId,
  } = useLeadTracking();

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
        const leadId = flushAndReturnLeadId();
        register.mutate(
          {
            name: values.name,
            email: values.email,
            password: values.password,
            leadId: leadId ?? undefined,
          },
          { onSettled: () => setSubmitting(false) }
        );
      }}
    >
      {({ setFieldValue }) => (
        <Form className="space-y-4">
          <LeadFieldSync onField={trackField} />

          <FormikField
            name="name"
            label={t('name')}
            autoComplete="name"
            icon={<User className="size-4" />}
            onFocus={markFirstInputFocus}
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
            onFocus={markPasswordTouched}
          />
          <FormikField
            name="confirmPassword"
            label={t('confirmPassword')}
            type="password"
            autoComplete="new-password"
            icon={<Lock className="size-4" />}
            onFocus={markConfirmPasswordTouched}
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
            onChange={(checked) => {
              setFieldValue('terms', checked);
              if (checked) markTermsAccepted();
            }}
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
            onChange={(checked) => {
              setFieldValue('privacy', checked);
              if (checked) markPrivacyAccepted();
            }}
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
