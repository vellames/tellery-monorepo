'use client';

import { Formik, Form } from 'formik';
import { Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormikField } from '@/components/molecules';
import { useLogin } from '@/lib/hooks/use-auth';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';

const initialValues: LoginFormValues = { email: '', password: '' };

export function LoginForm() {
  const login = useLogin();

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
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          icon={<Mail className="size-4" />}
        />
        <FormikField
          name="password"
          label="Senha"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          icon={<Lock className="size-4" />}
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base font-semibold"
          disabled={login.isPending}
        >
          {login.isPending && <Loader2 className="size-4 animate-spin" />}
          Entrar
        </Button>
      </Form>
    </Formik>
  );
}
