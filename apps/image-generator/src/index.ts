import fs from 'fs';
import path from 'path';
import { loadConfig } from './config';
import { buildJobs, runJobs, writeManifest } from './generator';
import { HistorySpecFile, JobResult } from './types';
import { WavespeedClient } from './wavespeed-client';

function readSpec(inputPath: string): HistorySpecFile {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Input file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Input JSON must be an object.');
  }

  return parsed as HistorySpecFile;
}

function summarize(results: JobResult[]): void {
  const counts = results.reduce(
    (acc, r) => {
      acc[r.status] += 1;
      return acc;
    },
    { generated: 0, skipped: 0, failed: 0 }
  );

  console.log('');
  console.log(`[image-generator] done — ${results.length} jobs: ` +
    `${counts.generated} generated, ${counts.skipped} skipped, ${counts.failed} failed`);

  const failures = results.filter((r) => r.status === 'failed');
  for (const failure of failures) {
    console.log(`  - ${failure.category}/${failure.key}: ${failure.error}`);
  }
}

async function main(): Promise<void> {
  const config = loadConfig(process.argv.slice(2));

  const spec = readSpec(config.inputPath);
  const jobs = buildJobs(spec, config.outputDir, config.prefixMaster);

  if (jobs.length === 0) {
    throw new Error('No image specs found in the input file.');
  }

  console.log(`[image-generator] input:     ${path.resolve(config.inputPath)}`);
  console.log(`[image-generator] output:    ${path.resolve(config.outputDir)}`);
  console.log(`[image-generator] model:     ${config.model}`);
  console.log(`[image-generator] resolution: ${config.resolution}`);
  console.log(`[image-generator] prefix master prompt: ${config.prefixMaster}`);
  console.log(`[image-generator] concurrency: ${config.concurrency}`);
  console.log(`[image-generator] ${jobs.length} image(s) to generate`);

  const client = new WavespeedClient(config.apiKey, config.model);
  const results = await runJobs(client, jobs, config);

  writeManifest(results, config.outputDir);
  console.log(`[image-generator] manifest:  ${path.join(config.outputDir, 'manifest.json')}`);

  summarize(results);
}

main().catch((error) => {
  console.error('[image-generator] fatal error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
