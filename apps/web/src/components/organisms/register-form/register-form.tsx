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

/**
 * Watchdog window for the form to become visible. If the IntersectionObserver
 * hasn't reported visibility by this deadline, we capture an error so the
 * failure surfaces as a Sentry issue instead of a silent blank screen.
 */
const FORM_VISIBLE_TIMEOUT_MS = 5000;

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

/**
 * Returns the element's bounding rect, or `undefined` if the element is missing
 * or `getBoundingClientRect` throws. Telemetry must never break the form, so a
 * measurement failure degrades to "no data" rather than throwing.
 */
function safeRect(
  el: HTMLFormElement | null
): DOMRect | undefined {
  if (!el) return undefined;
  try {
    return el.getBoundingClientRect();
  } catch {
    return undefined;
  }
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
    const hasObserver = 'IntersectionObserver' in window;

    // Baseline: capture the form's geometry + feature support at mount, before
    // the observer has a chance to fire. This runs even if the observer never
    // reports visibility, so we can distinguish "form never mounted" / "form
    // mounted at 0×0 (layout collapse)" / "observer never fired".
    const mountRect = safeRect(form);
    addSignupBreadcrumb(SignupBreadcrumb.FORM_MOUNTED, {
      hasFormRef: Boolean(form),
      hasIntersectionObserver: hasObserver,
      rectWidth: mountRect?.width,
      rectHeight: mountRect?.height,
      rectX: mountRect?.x,
      rectY: mountRect?.y,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    let observer: IntersectionObserver | null = null;
    let lastEntry: IntersectionObserverEntry | null = null;
    let visibilityTimeoutId: ReturnType<typeof setTimeout> | null = null;

    if (!form || !hasObserver) {
      // No form ref or no IntersectionObserver — fall back to "visible" so the
      // funnel doesn't stall. The FORM_MOUNTED breadcrumb above carries the
      // reason (hasFormRef / hasIntersectionObserver).
      addBreadcrumbOnce(SignupBreadcrumb.FORM_VISIBLE);
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          lastEntry = entry;
          if (!entry.isIntersecting) return;
          addBreadcrumbOnce(SignupBreadcrumb.FORM_VISIBLE, {
            ratio: entry.intersectionRatio,
            rectWidth: entry.boundingClientRect.width,
            rectHeight: entry.boundingClientRect.height,
          });
          observer?.disconnect();
        },
        { threshold: 0.25 }
      );

      observer.observe(form);

      // Watchdog: if the form hasn't become visible by the deadline, capture
      // an error with the current geometry + last observer entry so the
      // failure surfaces as a Sentry issue rather than a silent blank screen.
      visibilityTimeoutId = setTimeout(() => {
        if (breadcrumbGuardsRef.current.has(SignupBreadcrumb.FORM_VISIBLE)) {
          return;
        }

        const timeoutRect = safeRect(form);
        const error = new Error(
          'Signup form did not become visible within timeout'
        );
        captureSignupException(error, SignupBreadcrumb.FORM_VISIBLE_TIMEOUT, {
          hasFormRef: Boolean(form),
          rectWidth: timeoutRect?.width,
          rectHeight: timeoutRect?.height,
          lastIntersectionRatio: lastEntry?.intersectionRatio ?? null,
          lastIsIntersecting: lastEntry?.isIntersecting ?? null,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        });
      }, FORM_VISIBLE_TIMEOUT_MS);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;

      // Final geometry snapshot on tab hide — complements PAGE_HIDDEN when the
      // user abandons before the visibility timeout fires.
      const exitRect = safeRect(form);
      addSignupBreadcrumb(SignupBreadcrumb.FORM_RECT_SNAPSHOT, {
        rectWidth: exitRect?.width,
        rectHeight: exitRect?.height,
        becameVisible: breadcrumbGuardsRef.current.has(
          SignupBreadcrumb.FORM_VISIBLE
        ),
      });
      addSignupBreadcrumb(SignupBreadcrumb.PAGE_HIDDEN, {
        timeOnPageMs: Math.round(performance.now()),
        scrollY: window.scrollY,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (visibilityTimeoutId !== null) {
        clearTimeout(visibilityTimeoutId);
      }
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
