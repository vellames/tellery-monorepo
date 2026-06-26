'use client';

import { Formik, Form } from 'formik';
import { Loader2 } from 'lucide-react';
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
      onSubmit={(values) => login.mutate(values)}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-4">
          <FormikField
            name="email"
            label="E-mail"
            type="email"
            placeholder="voce@exemplo.com"
            autoComplete="email"
          />
          <FormikField
            name="password"
            label="Senha"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={login.isPending || isSubmitting}
          >
            {(login.isPending || isSubmitting) && (
              <Loader2 className="animate-spin" />
            )}
            Entrar
          </Button>
        </Form>
      )}
    </Formik>
  );
}
