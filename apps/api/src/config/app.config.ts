import "dotenv/config";

const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4-pro";

export const appConfig = {
  port: process.env.PORT ?? 3232,

  database: {
    url: process.env.DATABASE_URL,
  },

  language: {
    default: process.env.DEFAULT_LANGUAGE ?? "pt-BR",
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: DEFAULT_MODEL,
    intentDetectorModel: process.env.OPENROUTER_INTENT_MODEL ?? DEFAULT_MODEL,
    objectAgentModel: process.env.OPENROUTER_OBJECT_MODEL ?? DEFAULT_MODEL,
    characterAgentModel:
      process.env.OPENROUTER_CHARACTER_MODEL ?? DEFAULT_MODEL,
    intentDetectorThreshold: Number(
      process.env.INTENT_DETECTOR_THRESHOLD ?? "0.5"
    ),
  },
} as const;
