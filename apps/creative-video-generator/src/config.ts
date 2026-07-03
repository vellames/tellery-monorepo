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
  imagesMapPath: string;
  slug: string;
  outputDir: string;
  model: string;
  llmModel: string;
  llmApiKey: string;
  reasoningEffort: string | null;
  apiKey: string;
  duration: number;
  resolution: string;
  aspectRatio: string;
  generateAudio: boolean;
  prefixMaster: boolean;
  promptOnly: boolean;
  dryRun: boolean;
  promptFile: string | null;
  force: boolean;
  useReferenceImages: boolean;
  imagesDir: string;
}

export const DEFAULT_MODEL = 'bytedance/seedance-2.0/text-to-video';
export const DEFAULT_OUTPUT_BASE = 'output';
export const DEFAULT_DURATION = 15;
export const DEFAULT_RESOLUTION = '720p';
export const DEFAULT_ASPECT_RATIO = '9:16';
export const DEFAULT_GENERATE_AUDIO = true;
export const DEFAULT_USE_REFERENCE_IMAGES = true;
export const DEFAULT_LLM_MODEL = 'deepseek/deepseek-v4-pro';
export const DEFAULT_REASONING_EFFORT = 'high';
export const DEFAULT_IMAGES_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  'image-generator',
  'output'
);
export const SUPPORTED_RESOLUTIONS = new Set(['480p', '720p', '1080p']);
export const SUPPORTED_REASONING_EFFORTS = new Set([
  'low',
  'medium',
  'high',
  'xhigh',
]);
export const SUPPORTED_ASPECT_RATIOS = new Set([
  '1:1',
  '3:2',
  '2:3',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
]);
export const MIN_DURATION = 4;
export const MAX_DURATION = 15;
const IMAGES_MAP_SUFFIX = '-images-map';
const JSON_EXTENSION = '.json';

export function deriveSlug(inputPath: string): string {
  const base = path.basename(inputPath, path.extname(inputPath));
  if (base.endsWith(IMAGES_MAP_SUFFIX)) {
    return base.slice(0, -IMAGES_MAP_SUFFIX.length);
  }
  return base;
}

export function deriveImagesMapPath(
  inputPath: string,
  slug: string
): string | null {
  const dir = path.dirname(inputPath);
  const candidate = path.join(dir, `${slug}${IMAGES_MAP_SUFFIX}${JSON_EXTENSION}`);
  return fs.existsSync(candidate) ? candidate : null;
}

function required(name: string, source: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name} (set it in ${source})`
    );
  }
  return value;
}

function parseArgs(argv: string[]): {
  inputPath: string;
  imagesMapPath: string;
  slug: string;
  outputDir: string;
  model: string;
  llmModel: string;
  reasoningEffort: string | null;
  duration: number;
  resolution: string;
  aspectRatio: string;
  generateAudio: boolean;
  prefixMaster: boolean;
  promptOnly: boolean;
  dryRun: boolean;
  promptFile: string | null;
  force: boolean;
  useReferenceImages: boolean;
  imagesDir: string;
} {
  const positional: string[] = [];
  let imagesMapPath: string | undefined;
  let outputDir: string | undefined;
  let model = DEFAULT_MODEL;
  let llmModel = DEFAULT_LLM_MODEL;
  let reasoningEffort: string | null = DEFAULT_REASONING_EFFORT;
  let duration = DEFAULT_DURATION;
  let resolution = DEFAULT_RESOLUTION;
  let aspectRatio = DEFAULT_ASPECT_RATIO;
  let generateAudio = DEFAULT_GENERATE_AUDIO;
  let prefixMaster = true;
  let promptOnly = false;
  let dryRun = false;
  let promptFile: string | null = null;
  let force = false;
  let useReferenceImages = DEFAULT_USE_REFERENCE_IMAGES;
  let imagesDir = DEFAULT_IMAGES_DIR;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case '--images-map':
        imagesMapPath = next;
        i++;
        break;
      case '--output':
        outputDir = next;
        i++;
        break;
      case '--model':
        model = next;
        i++;
        break;
      case '--llm-model':
        llmModel = next;
        i++;
        break;
      case '--reasoning-effort':
        reasoningEffort = next;
        i++;
        break;
      case '--duration':
        duration = Number(next);
        i++;
        break;
      case '--resolution':
        resolution = next;
        i++;
        break;
      case '--aspect-ratio':
        aspectRatio = next;
        i++;
        break;
      case '--generate-audio':
        generateAudio = true;
        break;
      case '--no-generate-audio':
        generateAudio = false;
        break;
      case '--prefix-master':
        prefixMaster = true;
        break;
      case '--no-prefix-master':
        prefixMaster = false;
        break;
      case '--prompt-only':
        promptOnly = true;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--prompt-file':
        promptFile = next;
        i++;
        break;
      case '--force':
        force = true;
        break;
      case '--reference-images':
        useReferenceImages = true;
        break;
      case '--no-reference-images':
        useReferenceImages = false;
        break;
      case '--images-dir':
        imagesDir = next;
        i++;
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
    throw new Error('Missing required <history.json> path argument.');
  }

  const slug = deriveSlug(inputPath);

  const resolvedImagesMapPath =
    imagesMapPath ?? deriveImagesMapPath(inputPath, slug) ?? '';
  const resolvedOutputDir = outputDir ?? path.join(DEFAULT_OUTPUT_BASE, slug);

  if (!SUPPORTED_RESOLUTIONS.has(resolution)) {
    throw new Error(
      `Unsupported resolution "${resolution}". Valid values: ${[...SUPPORTED_RESOLUTIONS].join(', ')}`
    );
  }

  if (
    reasoningEffort !== null &&
    !SUPPORTED_REASONING_EFFORTS.has(reasoningEffort)
  ) {
    throw new Error(
      `Unsupported reasoning effort "${reasoningEffort}". Valid values: ${[...SUPPORTED_REASONING_EFFORTS].join(', ')}`
    );
  }

  if (!SUPPORTED_ASPECT_RATIOS.has(aspectRatio)) {
    throw new Error(
      `Unsupported aspect ratio "${aspectRatio}". Valid values: ${[...SUPPORTED_ASPECT_RATIOS].join(', ')}`
    );
  }

  if (!Number.isFinite(duration) || duration < MIN_DURATION || duration > MAX_DURATION) {
    throw new Error(
      `--duration must be between ${MIN_DURATION} and ${MAX_DURATION} seconds (got "${duration}")`
    );
  }

  if (promptOnly && dryRun) {
    throw new Error(
      '--prompt-only and --dry-run are mutually exclusive. --prompt-only stops after the LLM; --dry-run also builds the Seedance payload.'
    );
  }

  if (!llmModel && !promptFile) {
    throw new Error(
      'No LLM model: set OPENROUTER_MODEL in .env or pass --llm-model. (Alternatively, skip the LLM with --prompt-file.)'
    );
  }

  return {
    inputPath,
    imagesMapPath: resolvedImagesMapPath,
    slug,
    outputDir: resolvedOutputDir,
    model,
    llmModel,
    reasoningEffort,
    duration,
    resolution,
    aspectRatio,
    generateAudio,
    prefixMaster,
    promptOnly,
    dryRun,
    promptFile,
    force,
    useReferenceImages,
    imagesDir,
  };
}

function printHelp(): void {
  console.log(`
creative-video-generator — generate a 15s TikTok/Reels creative via LLM + WaveSpeed Seedance 2.0

Usage:
  npm start -w @ai-history/creative-video-generator -- <history.json> [options]

Input:
  <history.json>            Path to the history mock JSON (mocks/<slug>.json).
  --images-map <path>       Path to the image map JSON. Defaults to the sibling
                            <slug>-images-map.json in the same directory.

Modes:
  (none)                    Full run: LLM → Seedance → download .mp4 (spends credits).
  --dry-run                 LLM → builds the exact Seedance payload and STOPS.
                            Prints the payload and writes it to manifest; does NOT
                            call WaveSpeed.
  --prompt-only             Runs the LLM and saves the video prompt, then STOPS.
                            Does not build the Seedance payload. Useful to iterate
                            on creative direction.
  --prompt-file <path>      Load a previously saved video prompt JSON and skip the
                            LLM. Combine with --dry-run to audit the final payload,
                            or use alone to generate the video from a tuned prompt.

Options:
  --output <dir>            Output directory (default: ${DEFAULT_OUTPUT_BASE}/<slug>, derived from the input filename)
  --model <slug>            WaveSpeed Seedance model path (default: ${DEFAULT_MODEL})
  --llm-model <slug>        OpenRouter model for prompt writing (default: ${DEFAULT_LLM_MODEL})
  --reasoning-effort <lvl>  low | medium | high | xhigh (default: ${DEFAULT_REASONING_EFFORT}). Only affects the LLM call.
  --duration <s>            Clip length in seconds, ${MIN_DURATION}-${MAX_DURATION} (default: ${DEFAULT_DURATION})
  --resolution <res>        480p | 720p | 1080p (default: ${DEFAULT_RESOLUTION})
  --aspect-ratio <ratio>    e.g. 9:16, 16:9, 1:1 (default: ${DEFAULT_ASPECT_RATIO})
  --no-generate-audio       Disable native audio generation (default: audio on)
  --no-reference-images     Do not upload reference images to S3 / send to Seedance
  --reference-images        Force reference images on (default: on)
  --images-dir <dir>        image-generator output directory (default: ../image-generator/output)
  --no-prefix-master        Do not prepend the image-map master prompt to the context
  --force                   Re-generate even if the output file already exists
  -h, --help                Show this help

The slug is derived from the input filename by stripping the
"-images-map" suffix and the extension. For example,
"mocks/o-relogio-parado.json" resolves to slug "o-relogio-parado"
and outputs to "${DEFAULT_OUTPUT_BASE}/o-relogio-parado".

Environment:
  OPENROUTER_API_KEY        Required (loaded from the root .env file)
  OPENROUTER_MODEL          Default LLM model (loaded from the root .env file)
  WAVESPEED_API_KEY         Required (loaded from the root .env file)
  AWS_REGION                Required when using reference images (default: on)
  AWS_ACCESS_KEY_ID         Required when using reference images
  AWS_SECRET_ACCESS_KEY     Required when using reference images
  AWS_S3_BUCKET             Required when using reference images
  AWS_S3_PRESIGNED_EXPIRATION_SECONDS  Optional (default: 3600)
`);
}

export function loadConfig(argv: string[]): GeneratorConfig {
  const parsed = parseArgs(argv);
  return {
    ...parsed,
    llmApiKey: required('OPENROUTER_API_KEY', '.env'),
    apiKey: required('WAVESPEED_API_KEY', '.env'),
  };
}
