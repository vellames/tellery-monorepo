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

export interface GeneratorConfig {
  inputPath: string;
  outputDir: string;
  model: string;
  resolution: string;
  apiKey: string;
  prefixMaster: boolean;
  concurrency: number;
  force: boolean;
}

export const DEFAULT_MODEL = 'google/nano-banana-2/text-to-image';
export const DEFAULT_RESOLUTION = '1k';
export const DEFAULT_OUTPUT_DIR = 'output';
export const DEFAULT_CONCURRENCY = 3;
export const SUPPORTED_RESOLUTIONS = new Set(['0.5k', '1k', '2k', '4k']);

function required(name: string, source: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (set it in ${source})`);
  }
  return value;
}

function parseArgs(argv: string[]): {
  inputPath: string;
  outputDir: string;
  model: string;
  resolution: string;
  prefixMaster: boolean;
  concurrency: number;
  force: boolean;
} {
  const positional: string[] = [];
  let outputDir = DEFAULT_OUTPUT_DIR;
  let model = DEFAULT_MODEL;
  let resolution = DEFAULT_RESOLUTION;
  let prefixMaster = true;
  let concurrency = DEFAULT_CONCURRENCY;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case '--output':
        outputDir = next;
        i++;
        break;
      case '--model':
        model = next;
        i++;
        break;
      case '--resolution':
        resolution = next;
        i++;
        break;
      case '--concurrency':
        concurrency = Number(next);
        i++;
        break;
      case '--no-prefix-master':
        prefixMaster = false;
        break;
      case '--prefix-master':
        prefixMaster = true;
        break;
      case '--force':
        force = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          throw new Error(`Unknown option: ${arg}`);
        }
        positional.push(arg);
        break;
    }
  }

  const inputPath = positional[0];
  if (!inputPath) {
    printHelp();
    throw new Error('Missing required <input.json> path argument.');
  }

  if (!SUPPORTED_RESOLUTIONS.has(resolution)) {
    throw new Error(
      `Unsupported resolution "${resolution}". Valid values: ${[...SUPPORTED_RESOLUTIONS].join(', ')}`
    );
  }

  if (!Number.isFinite(concurrency) || concurrency < 1) {
    throw new Error(`--concurrency must be a positive integer (got "${concurrency}")`);
  }

  return { inputPath, outputDir, model, resolution, prefixMaster, concurrency, force };
}

function printHelp(): void {
  console.log(`
image-generator — generate story images via WaveSpeed (nano-banana-2)

Usage:
  npm start -w @ai-history/image-generator -- <input.json> [options]

Options:
  --output <dir>            Output directory (default: ${DEFAULT_OUTPUT_DIR})
  --model <slug>            WaveSpeed model path (default: ${DEFAULT_MODEL})
  --resolution <res>        0.5k | 1k | 2k | 4k (default: ${DEFAULT_RESOLUTION})
  --concurrency <n>         Parallel generations (default: ${DEFAULT_CONCURRENCY})
  --no-prefix-master        Do not prepend the "master" prompt to every image
  --force                   Re-generate even if the output file already exists
  -h, --help                Show this help

Environment:
  WAVESPEED_API_KEY         Required (loaded from the root .env file)
`);
}

export function loadConfig(argv: string[]): GeneratorConfig {
  const parsed = parseArgs(argv);
  return {
    ...parsed,
    apiKey: required('WAVESPEED_API_KEY', '.env'),
  };
}
