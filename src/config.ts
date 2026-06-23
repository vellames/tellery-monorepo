import "dotenv/config";

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE ?? "pt-BR";

export const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4-pro";

export const INTENT_DETECTOR_MODEL =
  process.env.OPENROUTER_INTENT_MODEL ?? DEFAULT_MODEL;

export const OBJECT_AGENT_MODEL =
  process.env.OPENROUTER_OBJECT_MODEL ?? DEFAULT_MODEL;

export const CHARACTER_AGENT_MODEL =
  process.env.OPENROUTER_CHARACTER_MODEL ?? DEFAULT_MODEL;

export const INTENT_DETECTOR_THRESHOLD = Number(
  process.env.INTENT_DETECTOR_THRESHOLD ?? "0.5"
);
