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
    objectAgentSystemPrompt:
      "Voce e um agente de objetos para uma engine de historias interativas. Sua tarefa e avaliar regras de revelacao de pistas de um objeto usando as intencoes detectadas e o estado atual da sessao.",
    objectAgentUserPrompt:
      'Objeto:\n{{object}}\n\nIntencoes detectadas:\n{{detectedIntents}}\n\nPistas ja descobertas na sessao:\n{{discoveredClueIds}}\n\nRegras elegiveis para avaliacao:\n{{eligibleRules}}\n\nResponda somente com JSON valido neste formato: [{"clueId": string, "reasoning": string}]. Retorne uma linha para cada pista que deve ser descoberta agora. Use apenas clueIds das regras elegiveis. Se nenhuma pista deve ser descoberta, retorne [].',
    characterAgentSystemPrompt:
      "Voce e um agente de personagem para uma engine de historias interativas. Responda sempre como o personagem, preserve a verdade fixa do caso e revele pistas apenas quando as regras elegiveis permitirem.",
    characterAgentUserPrompt:
      'Personagem:\n{{character}}\n\nResumo da conversa ate agora:\n{{conversationSummary}}\n\nHistorico recente:\n{{recentConversation}}\n\nMensagem do usuario:\n{{interaction}}\n\nIntencoes detectadas:\n{{detectedIntents}}\n\nPistas ja descobertas na sessao:\n{{discoveredClueIds}}\n\nRegras de pistas elegiveis:\n{{eligibleClueRules}}\n\nEstagios de segredo elegiveis:\n{{eligibleSecretStages}}\n\nResponda somente com JSON valido neste formato: {"reply": string, "discoveredClues": [{"clueId": string, "reasoning": string}], "updatedConversationSummary": string}. A fala deve seguir personalidade, estilo e limites do personagem. Use discoveredClues apenas com clueIds das regras ou estagios elegiveis. Se nenhuma pista for revelada, use [].',
  },
  en: {
    intentDetectorSystemPrompt:
      "You are an intent classifier for an interactive story engine. Classify the user's message using only the provided intents.",
    intentDetectorUserPrompt:
      'User message: {{message}}\n\nConfidence threshold: {{threshold}}\n\nPossible intents:\n{{intents}}\n\nReply only with valid JSON in this format: [{"intentId": string, "confidence": number, "reasoning": string}]. Return an array with one row for each intent whose confidence is greater than or equal to the threshold, ordered by relevance. Use confidence between 0 and 1. Use only IDs from the list. If no intent passes the threshold, return an array with off_topic if available; otherwise return an array with the closest intent.',
    objectAgentSystemPrompt:
      "You are an object agent for an interactive story engine. Your task is to evaluate an object's clue reveal rules using detected intents and current session state.",
    objectAgentUserPrompt:
      'Object:\n{{object}}\n\nDetected intents:\n{{detectedIntents}}\n\nAlready discovered session clues:\n{{discoveredClueIds}}\n\nEligible rules to evaluate:\n{{eligibleRules}}\n\nReply only with valid JSON in this format: [{"clueId": string, "reasoning": string}]. Return one row for each clue that should be discovered now. Use only clueIds from eligible rules. If no clue should be discovered, return [].',
    characterAgentSystemPrompt:
      "You are a character agent for an interactive story engine. Always answer as the character, preserve the fixed truth of the case, and reveal clues only when eligible rules allow it.",
    characterAgentUserPrompt:
      'Character:\n{{character}}\n\nConversation summary so far:\n{{conversationSummary}}\n\nRecent conversation:\n{{recentConversation}}\n\nUser message:\n{{interaction}}\n\nDetected intents:\n{{detectedIntents}}\n\nAlready discovered session clues:\n{{discoveredClueIds}}\n\nEligible clue rules:\n{{eligibleClueRules}}\n\nEligible secret stages:\n{{eligibleSecretStages}}\n\nReply only with valid JSON in this format: {"reply": string, "discoveredClues": [{"clueId": string, "reasoning": string}], "updatedConversationSummary": string}. The reply must follow the character personality, speaking style, and boundaries. Use discoveredClues only with clueIds from eligible rules or stages. If no clue is revealed, use [].',
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
