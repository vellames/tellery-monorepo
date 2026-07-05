import fs from 'fs';
import path from 'path';
import { ElevenLabsClient, VoiceSettings } from './elevenlabs-client';
import { S3ReferenceUploader, buildReferenceKey } from './s3-client';
import { VoiceoverResult } from './types';

const VOICEOVER_FORMAT = 'mp3';
const VOICEOVER_CATEGORY = 'voiceover';
const VOICEOVER_KEY = 'vo';
const VOICEOVER_CONTENT_TYPE = 'audio/mpeg';

export interface VoiceoverConfig {
  outputDir: string;
  voiceSettings: VoiceSettings;
  force: boolean;
}

/**
 * Generate the creative voiceover via ElevenLabs and persist it as
 * <slug>-voiceover.mp3 under outputDir, then upload it to S3 and presign a
 * GET URL to hand to Seedance as `@Audio1`.
 *
 * Returns a VoiceoverResult for the manifest. Mirrors the cover generator's
 * shape so both auxiliary artifacts look the same in the manifest.
 */
export async function generateVoiceover(
  script: string,
  slug: string,
  client: ElevenLabsClient,
  uploader: S3ReferenceUploader,
  config: VoiceoverConfig
): Promise<VoiceoverResult> {
  const outputPath = path.join(
    config.outputDir,
    `${slug}-voiceover.${VOICEOVER_FORMAT}`
  );

  if (!config.force && fs.existsSync(outputPath)) {
    console.log(
      `[creative-video-generator] voiceover skipped (already exists): ${outputPath}`
    );
    return {
      status: 'skipped',
      script,
      path: outputPath,
      s3Url: null,
      error: null,
    };
  }

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    console.log(
      `[creative-video-generator] voiceover → synthesizing via ElevenLabs…`
    );
    const audio = await client.generateSpeech(script, config.voiceSettings);
    fs.writeFileSync(outputPath, audio);
    console.log(
      `    → ${(audio.length / 1024).toFixed(0)}KB mp3 saved: ${outputPath}`
    );

    console.log(`[creative-video-generator] voiceover → uploading to S3…`);
    const s3Key = buildReferenceKey(
      slug,
      VOICEOVER_CATEGORY,
      VOICEOVER_KEY,
      VOICEOVER_FORMAT
    );
    const [uploaded] = await uploader.uploadAndSign([
      { localPath: outputPath, s3Key, contentType: VOICEOVER_CONTENT_TYPE },
    ]);
    console.log(`    → uploaded ${s3Key}`);

    return {
      status: 'generated',
      script,
      path: outputPath,
      s3Url: uploaded.url,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[creative-video-generator] voiceover FAILED: ${message}`);
    return {
      status: 'failed',
      script,
      path: null,
      s3Url: null,
      error: message,
    };
  }
}
