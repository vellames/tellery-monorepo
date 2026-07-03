import { GenerateOptions, GenerateResult, SeedancePayload } from './types';

const BASE_URL = 'https://api.wavespeed.ai/api/v3';

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

export class WavespeedClient {
  private readonly pollIntervalMs = 3000;
  private readonly timeoutMs = 600000;

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  /**
   * Build the exact request body that would be POSTed to WaveSpeed.
   * Exposed so --dry-run can show the payload without sending it.
   */
  buildRequestBody(opts: GenerateOptions): SeedancePayload {
    const body: SeedancePayload = {
      model: this.model,
      prompt: opts.prompt,
      aspect_ratio: opts.aspectRatio,
      duration: opts.duration,
      resolution: opts.resolution,
      generate_audio: opts.generateAudio,
    };
    if (opts.referenceImages && opts.referenceImages.length > 0) {
      body.reference_images = opts.referenceImages;
    }
    return body;
  }

  async generate(opts: GenerateOptions): Promise<GenerateResult> {
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
    const body = this.buildRequestBody(opts);

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
      throw new Error(
        `WaveSpeed submit response is missing a prediction id: ${JSON.stringify(payload)}`
      );
    }

    return id;
  }

  private async poll(
    id: string
  ): Promise<{ outputs: string[]; inferenceTime: number | null }> {
    const deadline = Date.now() + this.timeoutMs;
    const url = `${BASE_URL}/predictions/${id}/result`;

    while (Date.now() < deadline) {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `WaveSpeed poll failed (${response.status}) for prediction ${id}: ${error}`
        );
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
        throw new Error(
          `WaveSpeed prediction ${id} failed: ${data.error ?? 'unknown error'}`
        );
      }

      await sleep(this.pollIntervalMs);
    }

    throw new Error(
      `WaveSpeed prediction ${id} timed out after ${this.timeoutMs}ms.`
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
