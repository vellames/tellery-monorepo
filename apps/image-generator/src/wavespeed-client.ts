const BASE_URL = 'https://api.wavespeed.ai/api/v3';

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
  '1:4',
  '4:1',
  '1:8',
  '8:1',
]);

type PredictionStatus = 'created' | 'processing' | 'completed' | 'failed';

interface SubmitResponseData {
  id: string;
  status: PredictionStatus;
  outputs: string[];
  error?: string;
}

interface Envelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface GenerateOptions {
  prompt: string;
  aspectRatio: string;
  resolution: string;
  outputFormat: string;
}

export interface GenerateResult {
  outputs: string[];
  inferenceTime: number | null;
}

export class WavespeedClient {
  private readonly pollIntervalMs = 2000;
  private readonly timeoutMs = 180000;

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generate(opts: GenerateOptions): Promise<GenerateResult> {
    if (!SUPPORTED_ASPECT_RATIOS.has(opts.aspectRatio)) {
      throw new Error(
        `Unsupported aspect ratio "${opts.aspectRatio}". Valid values: ${[...SUPPORTED_ASPECT_RATIOS].join(', ')}`
      );
    }

    const id = await this.submit(opts);
    const result = await this.poll(id);

    if (result.outputs.length === 0) {
      throw new Error(`Prediction ${id} completed but produced no outputs.`);
    }

    return {
      outputs: result.outputs,
      inferenceTime: result.inferenceTime,
    };
  }

  private async submit(opts: GenerateOptions): Promise<string> {
    const body = {
      prompt: opts.prompt,
      aspect_ratio: opts.aspectRatio,
      resolution: opts.resolution,
      output_format: opts.outputFormat,
    };

    const response = await fetch(`${BASE_URL}/${this.model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `WaveSpeed submit failed (${response.status}) for model "${this.model}": ${error}`
      );
    }

    const payload = (await response.json()) as Envelope<SubmitResponseData>;
    const id = payload.data?.id;

    if (!id) {
      throw new Error(`WaveSpeed submit response is missing a prediction id: ${JSON.stringify(payload)}`);
    }

    return id;
  }

  private async poll(id: string): Promise<{ outputs: string[]; inferenceTime: number | null }> {
    const deadline = Date.now() + this.timeoutMs;
    const url = `${BASE_URL}/predictions/${id}/result`;

    while (Date.now() < deadline) {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`WaveSpeed poll failed (${response.status}) for prediction ${id}: ${error}`);
      }

      const payload = (await response.json()) as Envelope<{
        id: string;
        status: PredictionStatus;
        outputs: string[];
        error?: string;
        timings?: { inference?: number };
      }>;

      const data = payload.data;

      if (data.status === 'completed') {
        return {
          outputs: data.outputs ?? [],
          inferenceTime: data.timings?.inference ?? null,
        };
      }

      if (data.status === 'failed') {
        throw new Error(`WaveSpeed prediction ${id} failed: ${data.error ?? 'unknown error'}`);
      }

      await sleep(this.pollIntervalMs);
    }

    throw new Error(`WaveSpeed prediction ${id} timed out after ${this.timeoutMs}ms.`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
