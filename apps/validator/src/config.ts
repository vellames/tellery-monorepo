import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed
      .slice(equalsIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(__dirname, '../../..', '.env'));

export interface ValidatorConfig {
  apiUrl: string;
  email: string;
  password: string;
  historySlug: string;
  openRouterApiKey: string;
  investigatorModel: string;
  maxIterations: number;
  outputPath: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(): ValidatorConfig {
  return {
    apiUrl: process.env.VALIDATOR_API_URL ?? 'http://localhost:3232',
    email: required('VALIDATOR_EMAIL'),
    password: required('VALIDATOR_PASSWORD'),
    historySlug: process.env.VALIDATOR_HISTORY_SLUG ?? 'o-bilhete-na-mesa-7',
    openRouterApiKey: required('OPENROUTER_API_KEY'),
    investigatorModel:
      process.env.VALIDATOR_INVESTIGATOR_MODEL ?? 'google/gemini-2.5-flash',
    maxIterations: Number(process.env.VALIDATOR_MAX_ITERATIONS ?? 50),
    outputPath: process.env.VALIDATOR_OUTPUT ?? 'validator-output.txt',
  };
}
