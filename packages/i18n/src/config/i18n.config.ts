import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';
import i18nextHttpMiddleware from 'i18next-http-middleware';
import path from 'path';
import { SupportedLocale } from '../types/i18n.types';

export const supportedLanguages: readonly SupportedLocale[] = ['en', 'pt-BR'];
export type SupportedLanguage = SupportedLocale;

export const defaultLanguage: SupportedLocale = 'pt-BR';

export const initI18n = async () => {
  await i18next
    .use(i18nextFsBackend)
    .use(i18nextHttpMiddleware.LanguageDetector)
    .init({
      fallbackLng: defaultLanguage,
      supportedLngs: supportedLanguages,
      preload: supportedLanguages,

      backend: {
        loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
      },

      detection: {
        order: ['header', 'querystring', 'cookie'],
        lookupHeader: 'accept-language',
        lookupQuerystring: 'lang',
        lookupCookie: 'i18next',
        caches: false,
      },

      interpolation: {
        escapeValue: false,
      },

      defaultNS: 'common',
      ns: ['common', 'user', 'session', 'prompts'],
    });

  return i18next;
};

export { i18next };
export { i18nextHttpMiddleware };
