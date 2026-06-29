import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().default('deepseek/deepseek-v4-pro'),
  OPENROUTER_INTENT_MODEL: z.string().optional(),
  OPENROUTER_OBJECT_MODEL: z.string().optional(),
  OPENROUTER_CHARACTER_MODEL: z.string().optional(),
  OPENROUTER_REASONING_EFFORT: z
    .enum(['max', 'xhigh', 'high', 'medium', 'low', 'minimal', 'none'])
    .optional(),
  OPENROUTER_AUDIO_MODEL: z.string().optional(),
  INTENT_DETECTOR_THRESHOLD: z.coerce.number().min(0).max(1).default(0.5),
  DEFAULT_LANGUAGE: z.enum(['en', 'pt-BR']).default('pt-BR'),
  PORT: z.coerce.number().default(3232),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CORS_ORIGIN: z.string().default('*'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_PRESIGNED_EXPIRATION_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .default(3600),
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

export interface ModelPricing {
  promptPerMillion: number;
  completionPerMillion: number;
}

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
    reasoningEffort: env.OPENROUTER_REASONING_EFFORT ?? 'medium',
    audioModel: env.OPENROUTER_AUDIO_MODEL ?? 'openai/whisper-1',
    intentDetectorThreshold: env.INTENT_DETECTOR_THRESHOLD,
    pricing: {
      'deepseek/deepseek-v4-flash': {
        promptPerMillion: 0.09,
        completionPerMillion: 0.18,
      },
      'deepseek/deepseek-v4-pro': {
        promptPerMillion: 0.435,
        completionPerMillion: 0.87,
      },
      'google/gemini-2.5-flash-lite': {
        promptPerMillion: 0.1,
        completionPerMillion: 0.4,
      },
    } satisfies Record<string, ModelPricing>,
  },

  security: {
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  },

  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: env.AWS_S3_BUCKET,
    presignedExpirationSeconds: env.AWS_S3_PRESIGNED_EXPIRATION_SECONDS,
  },
} as const;
