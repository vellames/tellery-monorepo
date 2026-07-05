import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  ImageGenerateResult,
  ImageWavespeedClient,
} from './image-wavespeed-client';
import { CoverResult } from './types';

const COVER_FORMAT = 'jpg';
const SOURCE_FORMAT = 'png';
const JPEG_QUALITY_STEPS = [85, 75, 65, 55, 45, 35];
const DEFAULT_FALLDOWN_WIDTH = 1280;

export interface CoverGeneratorConfig {
  outputDir: string;
  aspectRatio: string;
  resolution: string;
  maxSizeBytes: number;
  maxDimension: number | null;
  force: boolean;
}

/**
 * Generate the creative cover via nano-banana-2 and persist it as
 * <slug>-cover.jpg under outputDir. Downloads the raw PNG from WaveSpeed,
 * then compresses it to JPEG (reusing the image-generator's quality/dimension
 * fallback ladder) before writing to disk.
 *
 * Returns a CoverResult that mirrors the video RunResult so the manifest
 * has a consistent shape for both artifacts.
 */
export async function generateCover(
  prompt: string,
  slug: string,
  client: ImageWavespeedClient,
  config: CoverGeneratorConfig
): Promise<CoverResult> {
  const outputPath = path.join(
    config.outputDir,
    `${slug}-cover.${COVER_FORMAT}`
  );

  if (!config.force && fs.existsSync(outputPath)) {
    console.log(
      `[creative-video-generator] cover skipped (already exists): ${outputPath}`
    );
    return {
      status: 'skipped',
      prompt,
      path: outputPath,
      remoteUrl: null,
      inferenceTime: null,
      error: null,
    };
  }

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    console.log(
      `[creative-video-generator] cover → generating (${config.aspectRatio}, ${config.resolution})…`
    );
    const result = await client.generate({
      prompt,
      aspectRatio: config.aspectRatio,
      resolution: config.resolution,
      outputFormat: SOURCE_FORMAT,
    });
    const remoteUrl = result.outputs[0];
    await download(remoteUrl, outputPath, config);
    console.log(
      `[creative-video-generator] cover saved: ${outputPath}${formatInference(result)}`
    );
    return {
      status: 'generated',
      prompt,
      path: outputPath,
      remoteUrl,
      inferenceTime: result.inferenceTime,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[creative-video-generator] cover FAILED: ${message}`);
    return {
      status: 'failed',
      prompt,
      path: null,
      remoteUrl: null,
      inferenceTime: null,
      error: message,
    };
  }
}

async function download(
  url: string,
  outputPath: string,
  config: CoverGeneratorConfig
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download cover (${response.status}) from ${url}`
    );
  }
  const source = Buffer.from(await response.arrayBuffer());
  const compressed = await compressToJpeg(source, config);
  fs.writeFileSync(outputPath, compressed.buffer);
  console.log(
    `    → ${(source.length / 1024).toFixed(0)}KB → ${(compressed.buffer.length / 1024).toFixed(0)}KB (q=${compressed.quality}${compressed.resized ? `, w=${compressed.resized}` : ''})`
  );
}

interface CompressedImage {
  buffer: Buffer;
  quality: number;
  resized: number | null;
}

/**
 * Compress the raw PNG to JPEG under the configured size budget, stepping
 * quality down and then width down. Ported verbatim from
 * apps/image-generator/src/generator.ts to keep both outputs consistent.
 */
async function compressToJpeg(
  source: Buffer,
  config: CoverGeneratorConfig
): Promise<CompressedImage> {
  const pipeline = (quality: number, width?: number) => {
    let s = sharp(source, { failOn: 'none' }).rotate();
    if (config.maxDimension) {
      s = s.resize({ width: config.maxDimension, withoutEnlargement: true });
    } else if (width) {
      s = s.resize({ width, withoutEnlargement: true });
    }
    return s.jpeg({ quality, mozjpeg: true });
  };

  for (const quality of JPEG_QUALITY_STEPS) {
    const buffer = await pipeline(quality).toBuffer();
    if (buffer.length <= config.maxSizeBytes) {
      return { buffer, quality, resized: config.maxDimension ?? null };
    }
  }

  for (const width of [1600, DEFAULT_FALLDOWN_WIDTH, 1024, 800]) {
    for (const quality of JPEG_QUALITY_STEPS) {
      const buffer = await pipeline(quality, width).toBuffer();
      if (buffer.length <= config.maxSizeBytes) {
        return { buffer, quality, resized: width };
      }
    }
  }

  const fallback = await pipeline(
    JPEG_QUALITY_STEPS[JPEG_QUALITY_STEPS.length - 1],
    800
  ).toBuffer();
  return {
    buffer: fallback,
    quality: JPEG_QUALITY_STEPS[JPEG_QUALITY_STEPS.length - 1],
    resized: 800,
  };
}

function formatInference(result: ImageGenerateResult): string {
  return result.inferenceTime !== null ? ` (${result.inferenceTime}ms)` : '';
}
