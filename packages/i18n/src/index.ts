import {
  defaultLanguage,
  i18next,
  SupportedLanguage,
  supportedLanguages,
} from './config/i18n.config';

export {
  defaultLanguage,
  i18next,
  i18nextHttpMiddleware,
  initI18n,
  SupportedLanguage,
  supportedLanguages,
} from './config/i18n.config';
export { i18nMiddleware } from './middleware/i18n.middleware';
export {
  I18nRequest,
  SupportedLocale,
  TranslationFunction,
  TranslationOptions,
} from './types/i18n.types';

export function normalizeLanguage(language?: string): SupportedLanguage {
  const requestedLanguage = language ?? defaultLanguage;

  if (supportedLanguages.includes(requestedLanguage as SupportedLanguage)) {
    return requestedLanguage as SupportedLanguage;
  }

  if (requestedLanguage.toLowerCase().startsWith('en')) return 'en';

  return 'pt-BR';
}

export function t(
  language: SupportedLanguage,
  key: string,
  params: Record<string, string> = {},
  namespace = 'prompts'
): string {
  return i18next.t(`${namespace}:${key}`, {
    ...params,
    lng: language,
  }) as string;
}
