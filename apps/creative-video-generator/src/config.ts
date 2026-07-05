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
  generateCover: boolean;
  coverModel: string;
  coverResolution: string;
  coverMaxSizeBytes: number;
  coverMaxDimension: number | null;
  generateVoiceover: boolean;
  voiceId: string;
  voiceModel: string;
  voiceSpeed: number;
  voiceStability: number;
  voiceSimilarity: number;
  voiceStyle: number;
  elevenLabsApiKey: string;
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
export const DEFAULT_GENERATE_COVER = true;
export const DEFAULT_COVER_MODEL = 'google/nano-banana-2/text-to-image';
export const DEFAULT_COVER_RESOLUTION = '1k';
export const DEFAULT_COVER_MAX_SIZE_KB = 200;
export const SUPPORTED_COVER_RESOLUTIONS = new Set(['0.5k', '1k', '2k', '4k']);
export const DEFAULT_GENERATE_VOICEOVER = true;
export const DEFAULT_VOICE_MODEL = 'eleven_multilingual_v2';
export const DEFAULT_VOICE_SPEED = 1.1;
export const DEFAULT_VOICE_STABILITY = 0.5;
export const DEFAULT_VOICE_SIMILARITY = 0.75;
export const DEFAULT_VOICE_STYLE = 0.0;
export const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';
export const MIN_VOICE_SPEED = 0.25;
export const MAX_VOICE_SPEED = 4.0;
export const MIN_VOICE_TRAIT = 0.0;
export const MAX_VOICE_TRAIT = 1.0;
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
  const candidate = path.join(
    dir,
    `${slug}${IMAGES_MAP_SUFFIX}${JSON_EXTENSION}`
  );
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
  generateCover: boolean;
  coverModel: string;
  coverResolution: string;
  coverMaxSizeKb: number;
  coverMaxDimension: number | null;
  generateVoiceover: boolean;
  voiceId: string;
  voiceModel: string;
  voiceSpeed: number;
  voiceStability: number;
  voiceSimilarity: number;
  voiceStyle: number;
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
  let generateCover = DEFAULT_GENERATE_COVER;
  let coverModel = DEFAULT_COVER_MODEL;
  let coverResolution = DEFAULT_COVER_RESOLUTION;
  let coverMaxSizeKb = DEFAULT_COVER_MAX_SIZE_KB;
  let coverMaxDimension: number | null = null;
  let generateVoiceover = DEFAULT_GENERATE_VOICEOVER;
  let voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
  let voiceModel = DEFAULT_VOICE_MODEL;
  let voiceSpeed = DEFAULT_VOICE_SPEED;
  let voiceStability = DEFAULT_VOICE_STABILITY;
  let voiceSimilarity = DEFAULT_VOICE_SIMILARITY;
  let voiceStyle = DEFAULT_VOICE_STYLE;

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
      case '--cover':
        generateCover = true;
        break;
      case '--no-cover':
        generateCover = false;
        break;
      case '--cover-model':
        coverModel = next;
        i++;
        break;
      case '--cover-resolution':
        coverResolution = next;
        i++;
        break;
      case '--cover-max-size':
        coverMaxSizeKb = Number(next);
        i++;
        break;
      case '--cover-max-dimension':
        coverMaxDimension = Number(next);
        i++;
        break;
      case '--voiceover':
        generateVoiceover = true;
        break;
      case '--no-voiceover':
        generateVoiceover = false;
        break;
      case '--voice-id':
        voiceId = next;
        i++;
        break;
      case '--voice-model':
        voiceModel = next;
        i++;
        break;
      case '--voice-speed':
        voiceSpeed = Number(next);
        i++;
        break;
      case '--voice-stability':
        voiceStability = Number(next);
        i++;
        break;
      case '--voice-similarity':
        voiceSimilarity = Number(next);
        i++;
        break;
      case '--voice-style':
        voiceStyle = Number(next);
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

  if (
    !Number.isFinite(duration) ||
    duration < MIN_DURATION ||
    duration > MAX_DURATION
  ) {
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

  if (generateCover) {
    if (!SUPPORTED_COVER_RESOLUTIONS.has(coverResolution)) {
      throw new Error(
        `Unsupported cover resolution "${coverResolution}". Valid values: ${[...SUPPORTED_COVER_RESOLUTIONS].join(', ')}`
      );
    }
    if (!Number.isFinite(coverMaxSizeKb) || coverMaxSizeKb <= 0) {
      throw new Error(
        `--cover-max-size must be a positive number in KB (got "${coverMaxSizeKb}")`
      );
    }
    if (
      coverMaxDimension !== null &&
      (!Number.isFinite(coverMaxDimension) || coverMaxDimension <= 0)
    ) {
      throw new Error(
        `--cover-max-dimension must be a positive integer (got "${coverMaxDimension}")`
      );
    }
  }

  // Seedance requires at least one reference image alongside a reference audio.
  // If the user disabled reference images but kept the voiceover on, we must
  // disable the voiceover to avoid a Seedance-side rejection.
  if (generateVoiceover && !useReferenceImages) {
    console.warn(
      '[creative-video-generator] voiceover disabled: --no-reference-images was set, ' +
        'but Seedance requires at least one reference image alongside the reference audio. ' +
        'Re-enable reference images or keep voiceover off.'
    );
    generateVoiceover = false;
  }

  if (generateVoiceover) {
    if (
      !Number.isFinite(voiceSpeed) ||
      voiceSpeed < MIN_VOICE_SPEED ||
      voiceSpeed > MAX_VOICE_SPEED
    ) {
      throw new Error(
        `--voice-speed must be between ${MIN_VOICE_SPEED} and ${MAX_VOICE_SPEED} (got "${voiceSpeed}")`
      );
    }
    for (const [name, value] of [
      ['--voice-stability', voiceStability],
      ['--voice-similarity', voiceSimilarity],
      ['--voice-style', voiceStyle],
    ] as const) {
      if (
        !Number.isFinite(value) ||
        value < MIN_VOICE_TRAIT ||
        value > MAX_VOICE_TRAIT
      ) {
        throw new Error(
          `${name} must be between ${MIN_VOICE_TRAIT} and ${MAX_VOICE_TRAIT} (got "${value}")`
        );
      }
    }
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
    generateCover,
    coverModel,
    coverResolution,
    coverMaxSizeKb,
    coverMaxDimension,
    generateVoiceover,
    voiceId,
    voiceModel,
    voiceSpeed,
    voiceStability,
    voiceSimilarity,
    voiceStyle,
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
  (none)                    Full run: LLM → VO (ElevenLabs) → Seedance → download .mp4 + cover.jpg (spends credits).
  --dry-run                 LLM → VO → builds the exact Seedance payload and STOPS.
                            Prints the payload and writes it to manifest; does NOT
                            call WaveSpeed for the video. Cover is NOT generated.
  --prompt-only             Runs the LLM and saves the video prompt, then STOPS.
                            Does not generate VO, build the Seedance payload, or call WaveSpeed.
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
  --aspect-ratio <ratio>    e.g. 9:16, 16:9, 1:1 (default: ${DEFAULT_ASPECT_RATIO}). Also used as the cover aspect ratio.
  --no-generate-audio       Disable native audio generation (default: audio on)
  --no-reference-images     Do not upload reference images to S3 / send to Seedance
  --reference-images        Force reference images on (default: on)
  --images-dir <dir>        image-generator output directory (default: ../image-generator/output)
  --no-prefix-master        Do not prepend the image-map master prompt to the context
  --force                   Re-generate even if the output files already exist
  --no-cover                Do not generate the cover image (default: cover on)
  --cover                   Force cover generation on (default: on)
  --cover-model <slug>      WaveSpeed text-to-image model for the cover (default: ${DEFAULT_COVER_MODEL})
  --cover-resolution <res>  0.5k | 1k | 2k | 4k (default: ${DEFAULT_COVER_RESOLUTION})
  --cover-max-size <kb>     Target cover JPEG size in KB (default: ${DEFAULT_COVER_MAX_SIZE_KB}). Quality and dimensions are auto-reduced to stay under this.
  --cover-max-dimension <px>  Optional cap on the cover's longest side in pixels (no cap by default)
  --no-voiceover            Do not generate the voiceover audio (default: VO on)
  --voiceover               Force voiceover generation on (default: on)
  --voice-id <id>           ElevenLabs voice ID (default: ${DEFAULT_VOICE_ID}, or ELEVENLABS_VOICE_ID env var).
                            Set to a pt-BR voice from your library for best results.
  --voice-model <slug>      ElevenLabs model (default: ${DEFAULT_VOICE_MODEL})
  --voice-speed <n>         Speech speed, ${MIN_VOICE_SPEED}-${MAX_VOICE_SPEED} (default: ${DEFAULT_VOICE_SPEED})
  --voice-stability <n>     0-1 (default: ${DEFAULT_VOICE_STABILITY})
  --voice-similarity <n>    0-1 (default: ${DEFAULT_VOICE_SIMILARITY})
  --voice-style <n>         0-1 (default: ${DEFAULT_VOICE_STYLE})
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
  ELEVENLABS_API_KEY        Required when using voiceover (default: on)
  ELEVENLABS_VOICE_ID       Optional ElevenLabs voice ID (overrides the default)
`);
}

export function loadConfig(argv: string[]): GeneratorConfig {
  const parsed = parseArgs(argv);

  if (parsed.voiceId === DEFAULT_VOICE_ID && parsed.generateVoiceover) {
    console.warn(
      `[creative-video-generator] using default voice ${DEFAULT_VOICE_ID} (English "George"). ` +
        'For pt-BR results, set ELEVENLABS_VOICE_ID in .env or pass --voice-id with a Portuguese voice from your library.'
    );
  }

  return {
    ...parsed,
    llmApiKey: required('OPENROUTER_API_KEY', '.env'),
    apiKey: required('WAVESPEED_API_KEY', '.env'),
    coverMaxSizeBytes: Math.round(parsed.coverMaxSizeKb * 1024),
    elevenLabsApiKey: parsed.generateVoiceover
      ? required('ELEVENLABS_API_KEY', '.env')
      : (process.env.ELEVENLABS_API_KEY ?? ''),
  };
}
