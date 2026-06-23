export type TranslationOptions = Record<string, unknown>;

export type TranslationFunction = (
  key: string,
  options?: TranslationOptions
) => string;

export type SupportedLocale = 'en' | 'pt-BR';

export interface I18nRequest {
  language: SupportedLocale;
  t: TranslationFunction;
}
