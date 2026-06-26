'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { Mail, MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FormikField } from '@/components/molecules';
import { config } from '@/lib/config';

export function ForgotPasswordForm() {
  const t = useTranslations('forgotPassword');
  const tCommon = useTranslations('common');
  const [done, setDone] = useState(false);

  const schema = useMemo(
    () =>
      yup.object({
        email: yup
          .string()
          .email(t('errors.invalidEmail'))
          .required(t('errors.emailRequired')),
      }),
    [t]
  );

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="text-gold mx-auto size-10" />
        <h2 className="font-heading text-primary text-xl font-bold">
          {t('successTitle')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('successMessage')}</p>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href={config.routes.login} />}
        >
          {tCommon('backToLogin')}
        </Button>
      </div>
    );
  }

  return (
    <Formik
      initialValues={{ email: '' }}
      validationSchema={schema}
      onSubmit={() => setDone(true)}
    >
      <Form className="space-y-4">
        <FormikField
          name="email"
          label={t('email')}
          type="email"
          autoComplete="email"
          icon={<Mail className="size-4" />}
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base font-semibold"
        >
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
    </Formik>
  );
}
