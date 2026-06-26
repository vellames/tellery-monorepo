import fs from 'fs';
import path from 'path';
import { GenerateResult, WavespeedClient } from './wavespeed-client';
import { GeneratorConfig } from './config';
import { GenerationJob, HistorySpecFile, JobResult, JobStatus } from './types';

const MASTER_DEFAULT_ASPECT = '16:9';
const OUTPUT_FORMAT = 'png';

export function buildJobs(
  spec: HistorySpecFile,
  outputDir: string,
  prefixMaster: boolean
): GenerationJob[] {
  const jobs: GenerationJob[] = [];
  const masterPrompt = spec.master?.prompt;

  const prefixed = (prompt: string): string =>
    prefixMaster && masterPrompt ? `${masterPrompt}\n\n${prompt}` : prompt;

  const groups: Array<{ category: keyof HistorySpecFile; spec: Record<string, { prompt: string; aspectRatio?: string }> | undefined }> = [
    { category: 'history', spec: spec.history },
    { category: 'location', spec: spec.location },
    { category: 'object', spec: spec.object },
    { category: 'characters', spec: spec.characters },
    { category: 'endings', spec: spec.endings },
  ];

  for (const group of groups) {
    if (!group.spec) continue;
    for (const [key, item] of Object.entries(group.spec)) {
      jobs.push({
        category: group.category as string,
        key,
        prompt: prefixed(item.prompt),
        aspectRatio: item.aspectRatio ?? MASTER_DEFAULT_ASPECT,
        outputPath: path.join(outputDir, group.category as string, `${key}.${OUTPUT_FORMAT}`),
      });
    }
  }

  return jobs;
}

export async function runJobs(
  client: WavespeedClient,
  jobs: GenerationJob[],
  config: GeneratorConfig
): Promise<JobResult[]> {
  const total = jobs.length;
  let index = 0;

  async function worker(workerId: number): Promise<void> {
    while (index < jobs.length) {
      const currentIndex = index++;
      const job = jobs[currentIndex];
      const label = `[${currentIndex + 1}/${total}] ${job.category}/${job.key}`;
      console.log(`${label} → generating (${job.aspectRatio}) [worker ${workerId}]`);

      if (!config.force && fs.existsSync(job.outputPath)) {
        console.log(`${label} → skipped (already exists)`);
        results[currentIndex] = toResult(job, 'skipped', null, null);
        continue;
      }

      try {
        fs.mkdirSync(path.dirname(job.outputPath), { recursive: true });
        const result = await client.generate({
          prompt: job.prompt,
          aspectRatio: job.aspectRatio,
          resolution: config.resolution,
          outputFormat: OUTPUT_FORMAT,
        });
        await download(result, job.outputPath);
        console.log(
          `${label} → saved ${job.outputPath}${formatInference(result)}`
        );
        results[currentIndex] = toResult(job, 'generated', result.outputs[0], null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`${label} → FAILED: ${message}`);
        results[currentIndex] = toResult(job, 'failed', null, message);
      }
    }
  }

  const results: JobResult[] = new Array(jobs.length);
  const workerCount = Math.min(config.concurrency, jobs.length);
  await Promise.all(Array.from({ length: workerCount }, (_, i) => worker(i + 1)));

  return results;
}

async function download(result: GenerateResult, outputPath: string): Promise<void> {
  const url = result.outputs[0];
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status}) from ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

function toResult(
  job: GenerationJob,
  status: JobStatus,
  remoteUrl: string | null,
  error: string | null
): JobResult {
  return {
    category: job.category,
    key: job.key,
    aspectRatio: job.aspectRatio,
    outputPath: job.outputPath,
    remoteUrl,
    status,
    error,
  };
}

function formatInference(result: GenerateResult): string {
  return result.inferenceTime !== null ? ` (${result.inferenceTime}ms)` : '';
}

export function writeManifest(results: JobResult[], outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });
  const manifestPath = path.join(outputDir, 'manifest.json');
  const payload = {
    generatedAt: new Date().toISOString(),
    summary: summarize(results),
    results,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(payload, null, 2), 'utf8');
}

function summarize(results: JobResult[]): Record<JobStatus, number> {
  return results.reduce(
    (acc, r) => {
      acc[r.status] += 1;
      return acc;
    },
    { generated: 0, skipped: 0, failed: 0 } as Record<JobStatus, number>
  );
}
