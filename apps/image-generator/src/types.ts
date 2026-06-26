export interface ImageSpec {
  prompt: string;
  aspectRatio?: string;
}

export interface HistorySpecFile {
  master?: ImageSpec;
  history?: Record<string, ImageSpec>;
  location?: Record<string, ImageSpec>;
  object?: Record<string, ImageSpec>;
  characters?: Record<string, ImageSpec>;
  endings?: Record<string, ImageSpec>;
}

export interface GenerationJob {
  category: string;
  key: string;
  prompt: string;
  aspectRatio: string;
  outputPath: string;
}

export type JobStatus = 'generated' | 'skipped' | 'failed';

export interface JobResult {
  category: string;
  key: string;
  aspectRatio: string;
  outputPath: string;
  remoteUrl: string | null;
  status: JobStatus;
  error: string | null;
}
