'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Formik, Form, useFormikContext } from 'formik';
import * as yup from 'yup';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CheckboxField, FormikField } from '@/components/molecules';
import { useRegister } from '@/lib/hooks/use-auth';
import { useLeadTracking } from '@/lib/hooks/use-lead-tracking';
import { trackSubmitLeadForm } from '@/lib/analytics/gtm-events';
import { config } from '@/lib/config';
import {
  addSignupBreadcrumb,
  captureSignupException,
  SignupBreadcrumb,
} from '@/lib/monitoring/sentry';
import { withQueryParams } from '@/lib/with-query-params';

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
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);
  const breadcrumbGuardsRef = useRef(new Set<string>());
  const loginHref = withQueryParams(
    config.routes.login,
    searchParams?.toString()
  );

  const {
    setFieldValue: trackField,
    markFirstInputFocus,
    markPasswordTouched,
    markConfirmPasswordTouched,
    markPrivacyAccepted,
    markTermsAccepted,
    flushAndReturnLeadId,
  } = useLeadTracking();

  const addSignupBreadcrumbOnce = (
    name: (typeof SignupBreadcrumb)[keyof typeof SignupBreadcrumb],
    data?: Record<string, unknown>
  ) => {
    if (breadcrumbGuardsRef.current.has(name)) return;
    breadcrumbGuardsRef.current.add(name);
    addSignupBreadcrumb(name, data);
  };

  const markAnyInputFocus = () => {
    markFirstInputFocus();
    addSignupBreadcrumbOnce(SignupBreadcrumb.FIRST_FIELD_FOCUS);
  };

  useEffect(() => {
    const addBreadcrumbOnce = (
      name: (typeof SignupBreadcrumb)[keyof typeof SignupBreadcrumb],
      data?: Record<string, unknown>
    ) => {
      if (breadcrumbGuardsRef.current.has(name)) return;
      breadcrumbGuardsRef.current.add(name);
      addSignupBreadcrumb(name, data);
    };

    addSignupBreadcrumb(SignupBreadcrumb.PAGE_LOADED, {
      path: window.location.pathname,
      search: window.location.search,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    const form = formRef.current;
    let observer: IntersectionObserver | null = null;
    if (!form || !('IntersectionObserver' in window)) {
      addBreadcrumbOnce(SignupBreadcrumb.FORM_VISIBLE);
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          addBreadcrumbOnce(SignupBreadcrumb.FORM_VISIBLE, {
            ratio: entry.intersectionRatio,
          });
          observer?.disconnect();
        },
        { threshold: 0.25 }
      );

      observer.observe(form);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;

      addSignupBreadcrumb(SignupBreadcrumb.PAGE_HIDDEN, {
        timeOnPageMs: Math.round(performance.now()),
        scrollY: window.scrollY,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
        addSignupBreadcrumb(SignupBreadcrumb.SUBMIT_CLICKED, { leadId });
        trackSubmitLeadForm();
        register.mutate(
          {
            name: values.name,
            email: values.email,
            password: values.password,
            leadId: leadId ?? undefined,
          },
          {
            onSuccess: () => {
              addSignupBreadcrumb(SignupBreadcrumb.REGISTER_SUCCESS, {
                leadId,
              });
            },
            onError: (error) => {
              captureSignupException(error, SignupBreadcrumb.REGISTER_ERROR, {
                leadId,
              });
            },
            onSettled: () => setSubmitting(false),
          }
        );
      }}
    >
      {({ setFieldValue }) => (
        <Form ref={formRef} className="space-y-4">
          <LeadFieldSync onField={trackField} />

          <FormikField
            name="name"
            label={t('name')}
            autoComplete="name"
            icon={<User className="size-4" />}
            onFocus={markAnyInputFocus}
          />
          <FormikField
            name="email"
            label={t('email')}
            type="email"
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            icon={<Mail className="size-4" />}
            onFocus={markAnyInputFocus}
          />
          <FormikField
            name="password"
            label={t('password')}
            type="password"
            autoComplete="new-password"
            icon={<Lock className="size-4" />}
            onFocus={() => {
              markAnyInputFocus();
              markPasswordTouched();
              addSignupBreadcrumbOnce(SignupBreadcrumb.PASSWORD_FOCUS);
            }}
          />
          <FormikField
            name="confirmPassword"
            label={t('confirmPassword')}
            type="password"
            autoComplete="new-password"
            icon={<Lock className="size-4" />}
            onFocus={() => {
              markAnyInputFocus();
              markConfirmPasswordTouched();
              addSignupBreadcrumbOnce(SignupBreadcrumb.CONFIRM_PASSWORD_FOCUS);
            }}
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
              if (checked) {
                markTermsAccepted();
                addSignupBreadcrumbOnce(SignupBreadcrumb.TERMS_CHECKED);
              }
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
              if (checked) {
                markPrivacyAccepted();
                addSignupBreadcrumbOnce(SignupBreadcrumb.PRIVACY_CHECKED);
              }
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
            render={<Link href={loginHref} />}
          >
            {tCommon('backToLogin')}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
