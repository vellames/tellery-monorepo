import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { type ReactNode } from 'react';
import ptBR from '@/messages/pt-BR.json';
import en from '@/messages/en.json';

const messages = { 'pt-BR': ptBR, en } as const;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

type Locale = keyof typeof messages;

export function renderWithProviders(
  ui: ReactNode,
  { locale = 'pt-BR', ...options }: { locale?: Locale } & RenderOptions = {}
) {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale={locale} messages={messages[locale]}>
          {ui}
        </NextIntlClientProvider>
      </QueryClientProvider>,
      options
    ),
  };
}

export function renderHookWithProviders<TResult>(
  hook: () => TResult,
  { locale = 'pt-BR' }: { locale?: Locale } = {}
) {
  const queryClient = makeQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
  return renderHook(hook, { wrapper });
}
