import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().default('deepseek/deepseek-v4-pro'),
  OPENROUTER_INTENT_MODEL: z.string().optional(),
  OPENROUTER_OBJECT_MODEL: z.string().optional(),
  OPENROUTER_CHARACTER_MODEL: z.string().optional(),
  INTENT_DETECTOR_THRESHOLD: z.coerce.number().min(0).max(1).default(0.5),
  DEFAULT_LANGUAGE: z.enum(['en', 'pt-BR']).default('pt-BR'),
  PORT: z.coerce.number().default(3232),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

const env = parsed.data;

export const appConfig = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  corsOrigin: env.CORS_ORIGIN,

  database: {
    url: env.DATABASE_URL,
  },

  language: {
    default: env.DEFAULT_LANGUAGE,
  },

  openrouter: {
    apiKey: env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: env.OPENROUTER_MODEL,
    intentDetectorModel: env.OPENROUTER_INTENT_MODEL ?? env.OPENROUTER_MODEL,
    objectAgentModel: env.OPENROUTER_OBJECT_MODEL ?? env.OPENROUTER_MODEL,
    characterAgentModel: env.OPENROUTER_CHARACTER_MODEL ?? env.OPENROUTER_MODEL,
    intentDetectorThreshold: env.INTENT_DETECTOR_THRESHOLD,
  },
} as const;
