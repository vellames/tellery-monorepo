import path from 'path';
import { loadConfig } from './config';
import { extractContext, readJson } from './history-extractor';
import {
  buildSeedancePayload,
  generateVideo,
  generateVideoPrompt,
  runDryRun,
  writeManifest,
} from './generator';
import { OpenRouterJsonClient } from './llm-client';
import { prepareReferenceImages } from './reference-images';
import { S3ReferenceUploader } from './s3-client';
import {
  HistoryFile,
  ImageMapFile,
  ReferenceImage,
  VideoPrompt,
} from './types';
import { WavespeedClient } from './wavespeed-client';
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
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as { shots?: unknown }).shots)
  ) {
    throw new Error(
      `Prompt file must be an object with a "shots" array: ${filePath}`
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

  const referenceImages: ReferenceImage[] = config.useReferenceImages
    ? await prepareReferenceImages(
        config.slug,
        config.imagesDir,
        S3ReferenceUploader.fromEnv()
      )
    : [];

  const { payload, generateOptions } = buildSeedancePayload(
    videoPrompt,
    config,
    referenceImages
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

  writeManifest(result, payload, config.outputDir);
}

main().catch((error) => {
  console.error(
    '[creative-video-generator] fatal error:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
