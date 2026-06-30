import { appConfig } from '../../config/app.config';
import { IAudioTranscriptionService, ILlmCallRecorder } from '../../interfaces';
import { computeAudioCostUsd } from '../../engine/llm/cost';

interface TranscriptionResponse {
  text: string;
  usage?: {
    seconds?: number;
    cost?: number;
  };
}

const FORMAT_FROM_CONTENT_TYPE: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
};

export class OpenRouterAudioTranscriptionService implements IAudioTranscriptionService {
  constructor(private readonly recorder: ILlmCallRecorder) {}

  async transcribe(input: {
    buffer: Buffer;
    contentType: string;
    filename: string;
    sessionId?: string;
  }): Promise<{ text: string }> {
    const apiKey = appConfig.openrouter.apiKey;
    const model = appConfig.openrouter.audioModel;
    const baseUrl = appConfig.openrouter.baseUrl;

    const base64Audio = input.buffer.toString('base64');
    const format =
      FORMAT_FROM_CONTENT_TYPE[input.contentType] ??
      input.filename.split('.').pop() ??
      'webm';

    console.log('[audio-transcription] sending to openrouter', {
      model,
      bufferSize: input.buffer.length,
      format,
    });

    const startedAt = Date.now();
    const res = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input_audio: {
          data: base64Audio,
          format,
        },
        language: 'pt',
      }),
    });
    const latencyMs = Date.now() - startedAt;

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'unknown');
      console.error('[audio-transcription] openrouter error', {
        status: res.status,
        body: errorBody,
      });
      throw new Error(
        `Audio transcription failed (${res.status}): ${errorBody}`
      );
    }

    const data = (await res.json()) as TranscriptionResponse;
    const text = data.text?.trim() ?? '';

    console.log('[audio-transcription] result', {
      textLength: text.length,
      text: text.slice(0, 100),
      usage: data.usage,
    });

    this.recordUsage(input.sessionId, model, data, latencyMs);

    return { text };
  }

  private recordUsage(
    sessionId: string | undefined,
    model: string,
    data: TranscriptionResponse,
    latencyMs: number
  ): void {
    if (!sessionId) return;

    const seconds = data.usage?.seconds;
    const costUsd =
      typeof data.usage?.cost === 'number'
        ? data.usage.cost
        : typeof seconds === 'number'
          ? computeAudioCostUsd(model, seconds, appConfig.openrouter.pricing)
          : 0;
    const audioSeconds =
      typeof seconds === 'number' ? Math.round(seconds) : null;

    this.recorder
      .record({
        sessionId,
        purpose: 'audio',
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd,
        latencyMs,
        audioSeconds,
      })
      .catch((error) => {
        console.error('[audio-transcription] failed to record usage', error);
      });
  }
}
