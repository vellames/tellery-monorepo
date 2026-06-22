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
      'Mensagem do usuario: {{message}}\n\nThreshold de confianca: {{threshold}}\n\nIntencoes possiveis:\n{{intents}}\n\nResponda somente com JSON valido neste formato: [{"intentId": string, "confidence": number, "reasoning": string}]. Retorne um array com uma linha para cada intencao cuja confianca seja maior ou igual ao threshold, em ordem de relevancia. Use confidence entre 0 e 1. Use apenas IDs da lista. Se nenhuma intencao passar do threshold, retorne um array com off_topic se existir; caso contrario, retorne um array com a intencao mais proxima.',
  },
  en: {
    intentDetectorSystemPrompt:
      "You are an intent classifier for an interactive story engine. Classify the user's message using only the provided intents.",
    intentDetectorUserPrompt:
      'User message: {{message}}\n\nConfidence threshold: {{threshold}}\n\nPossible intents:\n{{intents}}\n\nReply only with valid JSON in this format: [{"intentId": string, "confidence": number, "reasoning": string}]. Return an array with one row for each intent whose confidence is greater than or equal to the threshold, ordered by relevance. Use confidence between 0 and 1. Use only IDs from the list. If no intent passes the threshold, return an array with off_topic if available; otherwise return an array with the closest intent.',
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
