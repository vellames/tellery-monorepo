import path from 'path';
import { loadConfig } from './config';
import { generateCover } from './cover-generator';
import { ElevenLabsClient } from './elevenlabs-client';
import { extractContext, readJson } from './history-extractor';
import {
  buildSeedancePayload,
  generateVideo,
  generateVideoPrompt,
  runDryRun,
  writeManifest,
} from './generator';
import { ImageWavespeedClient } from './image-wavespeed-client';
import { OpenRouterJsonClient } from './llm-client';
import { prepareReferenceImages } from './reference-images';
import { S3ReferenceUploader } from './s3-client';
import {
  CoverResult,
  HistoryFile,
  ImageMapFile,
  ReferenceImage,
  VideoPrompt,
  VoiceoverResult,
} from './types';
import { WavespeedClient } from './wavespeed-client';
import { generateVoiceover } from './voiceover-generator';
import fs from 'fs';

function readPromptFile(filePath: string): VideoPrompt {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Prompt file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
  const obj = parsed as {
    shots?: unknown;
    cover?: unknown;
    voiceover?: unknown;
  };
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray(obj.shots)
  ) {
    throw new Error(
      `Prompt file must be an object with a "shots" array: ${filePath}`
    );
  }
  if (
    typeof obj.cover !== 'object' ||
    obj.cover === null ||
    typeof (obj.cover as { prompt?: unknown }).prompt !== 'string' ||
    (obj.cover as { prompt: string }).prompt.trim().length === 0
  ) {
    throw new Error(
      `Prompt file is missing a valid "cover.prompt" string: ${filePath}. ` +
        'Re-run with the LLM (no --prompt-file) to regenerate a prompt that includes the cover, or add a "cover": {"prompt": "..."} block by hand.'
    );
  }
  if (
    typeof obj.voiceover !== 'object' ||
    obj.voiceover === null ||
    typeof (obj.voiceover as { script?: unknown }).script !== 'string' ||
    (obj.voiceover as { script: string }).script.trim().length === 0
  ) {
    throw new Error(
      `Prompt file is missing a valid "voiceover.script" string: ${filePath}. ` +
        'Re-run with the LLM (no --prompt-file) to regenerate a prompt that includes the voiceover, or add a "voiceover": {"script": "..."} block by hand.'
    );
  }
  return parsed as VideoPrompt;
}

async function main(): Promise<void> {
  const config = loadConfig(process.argv.slice(2));

  const history = readJson<HistoryFile>(config.inputPath, 'History file');
  const imageMap = config.imagesMapPath
    ? readJson<ImageMapFile>(config.imagesMapPath, 'Image map file')
    : null;

  console.log(
    `[creative-video-generator] input:      ${path.resolve(config.inputPath)}`
  );
  console.log(`[creative-video-generator] slug:       ${config.slug}`);
  console.log(
    `[creative-video-generator] output:     ${path.resolve(config.outputDir)}`
  );
  console.log(`[creative-video-generator] model:      ${config.model}`);
  console.log(
    `[creative-video-generator] llm model:  ${config.llmModel || '(skipped via --prompt-file)'}`
  );
  console.log(
    `[creative-video-generator] reasoning:  ${config.reasoningEffort ?? 'off'}`
  );
  console.log(`[creative-video-generator] aspect:     ${config.aspectRatio}`);
  console.log(`[creative-video-generator] duration:   ${config.duration}s`);
  console.log(`[creative-video-generator] resolution: ${config.resolution}`);
  console.log(
    `[creative-video-generator] audio:      ${config.generateAudio ? 'on' : 'off'}`
  );
  console.log(
    `[creative-video-generator] references: ${config.useReferenceImages ? 'on' : 'off'}`
  );
  if (config.useReferenceImages) {
    console.log(`[creative-video-generator] images dir: ${config.imagesDir}`);
  }
  console.log(
    `[creative-video-generator] cover:      ${config.generateCover ? 'on' : 'off'}`
  );
  if (config.generateCover) {
    console.log(`[creative-video-generator] cover model: ${config.coverModel}`);
  }
  console.log(
    `[creative-video-generator] voiceover:  ${config.generateVoiceover ? 'on' : 'off'}`
  );
  if (config.generateVoiceover) {
    console.log(
      `[creative-video-generator] voice model: ${config.voiceModel} (voice: ${config.voiceId}, speed: ${config.voiceSpeed})`
    );
  }
  if (config.promptOnly)
    console.log('[creative-video-generator] mode: prompt-only');
  if (config.dryRun) console.log('[creative-video-generator] mode: dry-run');
  if (config.promptFile)
    console.log(`[creative-video-generator] prompt file: ${config.promptFile}`);

  const context = extractContext(history, imageMap, config.prefixMaster);

  const videoPrompt = config.promptFile
    ? readPromptFile(config.promptFile)
    : await generateVideoPrompt(
        context,
        new OpenRouterJsonClient(
          config.llmApiKey,
          config.llmModel,
          0.7,
          config.reasoningEffort
        ),
        config.slug,
        config.outputDir,
        config.duration
      );

  if (config.promptOnly) {
    console.log('');
    console.log(
      '[creative-video-generator] === VIDEO PROMPT (prompt-only) ==='
    );
    console.log(JSON.stringify(videoPrompt, null, 2));
    console.log('[creative-video-generator] ===============================');
    console.log(
      '[creative-video-generator] prompt-only complete — no payload built, WaveSpeed not called.'
    );
    return;
  }

  const s3Uploader = S3ReferenceUploader.fromEnv();

  const referenceImages: ReferenceImage[] = config.useReferenceImages
    ? await prepareReferenceImages(config.slug, config.imagesDir, s3Uploader)
    : [];

  // Generate the voiceover after reference images: Seedance requires at least
  // one reference image alongside the reference audio, so we only attempt the
  // VO when images are available (config enforces this guard).
  let voiceover: VoiceoverResult | null = null;
  if (config.generateVoiceover) {
    voiceover = await generateVoiceover(
      videoPrompt.voiceover.script,
      config.slug,
      new ElevenLabsClient(
        config.elevenLabsApiKey,
        config.voiceId,
        config.voiceModel
      ),
      s3Uploader,
      {
        outputDir: config.outputDir,
        voiceSettings: {
          stability: config.voiceStability,
          similarityBoost: config.voiceSimilarity,
          style: config.voiceStyle,
          useSpeakerBoost: true,
          speed: config.voiceSpeed,
        },
        force: config.force,
      }
    );
  }

  const referenceAudioUrls =
    voiceover?.status === 'generated' && voiceover.s3Url
      ? [voiceover.s3Url]
      : [];

  const { payload, generateOptions } = buildSeedancePayload(
    videoPrompt,
    config,
    referenceImages,
    referenceAudioUrls
  );

  let result;
  if (config.dryRun) {
    result = runDryRun(
      payload,
      config.slug,
      config.outputDir,
      referenceImages,
      videoPrompt.socialCaption
    );
  } else {
    result = await generateVideo(
      generateOptions,
      new WavespeedClient(config.apiKey, config.model),
      config,
      config.slug,
      referenceImages
    );
  }

  // The cover is generated only on a real run — dry-run and prompt-only stop
  // before spending image credits. The cover prompt comes from the same LLM
  // cycle that produced the video shots.
  let cover: CoverResult | null = null;
  if (!config.dryRun && config.generateCover) {
    cover = await generateCover(
      videoPrompt.cover.prompt,
      config.slug,
      new ImageWavespeedClient(config.apiKey, config.coverModel),
      {
        outputDir: config.outputDir,
        aspectRatio: config.aspectRatio,
        resolution: config.coverResolution,
        maxSizeBytes: config.coverMaxSizeBytes,
        maxDimension: config.coverMaxDimension,
        force: config.force,
      }
    );
  } else if (config.generateCover && config.dryRun) {
    console.log(
      '[creative-video-generator] cover skipped in dry-run mode (no WaveSpeed image call).'
    );
  }

  if (voiceover?.status === 'failed') {
    console.warn(
      '[creative-video-generator] voiceover failed — video generated WITHOUT reference audio. ' +
        'Re-run to retry, or pass --no-voiceover to silence this.'
    );
  }

  writeManifest(result, payload, config.outputDir, cover, voiceover);
}

main().catch((error) => {
  console.error(
    '[creative-video-generator] fatal error:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
