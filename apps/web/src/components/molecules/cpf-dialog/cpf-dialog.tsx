'use client';

import { useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { cpf } from 'cpf-cnpj-validator';
import { IdCard, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { FormikMaskedField } from '@/components/molecules';
import { useUpdateProfile } from '@/lib/hooks/use-profile';
import type { User } from '@/lib/types/auth';

export interface CpfDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
  /** Called after the CPF is saved, so the caller can resume the original flow. */
  onSuccess: () => void;
}

export function CpfDialog({ open, onClose, user, onSuccess }: CpfDialogProps) {
  const t = useTranslations('subscription');
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');
  const updateProfile = useUpdateProfile();

  const schema = useMemo(
    () =>
      yup.object({
        ssn: yup
          .string()
          .test('cpf', t('errors.invalidSsn'), (value) =>
            value ? cpf.isValid(value) : false
          ),
      }),
    [t]
  );

  const closeIfIdle = () => {
    if (!updateProfile.isPending) onClose();
  };

  return (
    <Modal open={open} onClose={closeIfIdle} closeLabel={tCommon('close')}>
      <div className="flex flex-col gap-4 p-7">
        <div className="flex flex-col gap-2 pr-6">
          <h3 className="font-heading text-lg font-semibold text-stone-900">
            {t('cpfModalTitle')}
          </h3>
          <p className="text-sm leading-6 text-stone-600">
            {t('cpfModalDescription')}
          </p>
        </div>

        <Formik
          initialValues={{ ssn: '' }}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            updateProfile.mutate(
              { name: user.name, email: user.email, ssn: values.ssn },
              {
                onSuccess: () => {
                  onClose();
                  onSuccess();
                },
                onSettled: () => setSubmitting(false),
              }
            );
          }}
        >
          <Form className="space-y-4">
            <FormikMaskedField
              name="ssn"
              label={tProfile('ssn')}
              placeholder={tProfile('ssnPlaceholder')}
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
              {t('cpfModalSubmit')}
            </Button>
          </Form>
        </Formik>
      </div>
    </Modal>
  );
}
