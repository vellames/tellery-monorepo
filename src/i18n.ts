import { DEFAULT_LANGUAGE } from "./config";

export type SupportedLanguage = "pt-BR" | "en";

const supportedLanguages: SupportedLanguage[] = ["pt-BR", "en"];

export function normalizeLanguage(language?: string): SupportedLanguage {
  const requestedLanguage = language ?? DEFAULT_LANGUAGE;

  if (supportedLanguages.includes(requestedLanguage as SupportedLanguage)) {
    return requestedLanguage as SupportedLanguage;
  }

  if (requestedLanguage.toLowerCase().startsWith("en")) return "en";

  return "pt-BR";
}

export const i18n = {
  "pt-BR": {
    intentDetectorSystemPrompt:
      "Voce e um classificador de intencoes para uma engine de historias interativas. Classifique a mensagem do usuario usando apenas as intencoes fornecidas.",
    intentDetectorUserPrompt:
      'Mensagem do usuario: {{message}}\n\nIntencoes possiveis:\n{{intents}}\n\nResponda somente com JSON valido neste formato: {"primaryIntentId": string, "intentIds": string[], "confidence": number, "reasoning": string}. Use confidence entre 0 e 1. intentIds deve estar em ordem de relevancia e conter apenas IDs da lista. Se nenhuma intencao encaixar, use off_topic se existir; caso contrario, escolha a mais proxima.',
  },
  en: {
    intentDetectorSystemPrompt:
      "You are an intent classifier for an interactive story engine. Classify the user's message using only the provided intents.",
    intentDetectorUserPrompt:
      'User message: {{message}}\n\nPossible intents:\n{{intents}}\n\nReply only with valid JSON in this format: {"primaryIntentId": string, "intentIds": string[], "confidence": number, "reasoning": string}. Use confidence between 0 and 1. intentIds must be ordered by relevance and contain only IDs from the list. If no intent fits, use off_topic if available; otherwise choose the closest intent.',
  },
} satisfies Record<SupportedLanguage, Record<string, string>>;

export function t(
  language: SupportedLanguage,
  key: keyof (typeof i18n)[SupportedLanguage],
  params: Record<string, string> = {}
): string {
  return Object.entries(params).reduce(
    (text, [param, value]) => text.replaceAll(`{{${param}}}`, value),
    i18n[language][key]
  );
}
