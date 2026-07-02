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

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required value for ${name} (set it via CLI flag or ${name} in .env)`
    );
  }
  return value;
}

function parseArgs(argv: string[]): Partial<ValidatorConfig> {
  const parsed: Partial<ValidatorConfig> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case '--api-url':
        parsed.apiUrl = next;
        i++;
        break;
      case '--email':
        parsed.email = next;
        i++;
        break;
      case '--password':
        parsed.password = next;
        i++;
        break;
      case '--slug':
        parsed.historySlug = next;
        i++;
        break;
      case '--model':
        parsed.investigatorModel = next;
        i++;
        break;
      case '--max-iterations':
        parsed.maxIterations = Number(next);
        i++;
        break;
      case '--output':
        parsed.outputPath = next;
        i++;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

/**
 * Resolve config with precedence: CLI argument > environment variable > default.
 * The `.env` file is still loaded as fallback, so nothing passed via flag is required there.
 */
export function loadConfig(argv: string[] = process.argv.slice(2)): ValidatorConfig {
  const args = parseArgs(argv);

  const historySlug =
    args.historySlug ??
    process.env.VALIDATOR_HISTORY_SLUG ??
    'o-bilhete-na-mesa-7';
  // Default the output file to the slug, so parallel runs don't overwrite each other.
  const defaultOutput = `validator-output-${historySlug}.txt`;

  return {
    apiUrl: args.apiUrl ?? process.env.VALIDATOR_API_URL ?? 'http://localhost:3232',
    email: required('VALIDATOR_EMAIL', args.email ?? process.env.VALIDATOR_EMAIL),
    password: required(
      'VALIDATOR_PASSWORD',
      args.password ?? process.env.VALIDATOR_PASSWORD
    ),
    historySlug,
    openRouterApiKey: required(
      'OPENROUTER_API_KEY',
      args.openRouterApiKey ?? process.env.OPENROUTER_API_KEY
    ),
    investigatorModel:
      args.investigatorModel ??
      process.env.VALIDATOR_INVESTIGATOR_MODEL ??
      'deepseek/deepseek-v4-flash',
    maxIterations: Number(
      args.maxIterations ?? process.env.VALIDATOR_MAX_ITERATIONS ?? 50
    ),
    outputPath: args.outputPath ?? process.env.VALIDATOR_OUTPUT ?? defaultOutput,
  };
}
