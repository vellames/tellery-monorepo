import { appConfig } from '../../config/app.config';
import { IAudioTranscriptionService } from '../../interfaces';
import FormData from 'form-data';

interface OpenRouterTranscriptionResponse {
  text: string;
}

export class OpenRouterAudioTranscriptionService
  implements IAudioTranscriptionService
{
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = appConfig.openrouter.apiKey;
    this.model = appConfig.openrouter.audioModel;
    this.baseUrl = appConfig.openrouter.baseUrl;
  }

  async transcribe(input: {
    buffer: Buffer;
    contentType: string;
    filename: string;
  }): Promise<{ text: string }> {
    const form = new FormData();
    form.append('file', input.buffer, {
      filename: input.filename,
      contentType: input.contentType,
    });
    form.append('model', this.model);

    console.log('[audio-transcription] sending to openrouter', {
      model: this.model,
      bufferSize: input.buffer.length,
      contentType: input.contentType,
    });

    const formHeaders = form.getHeaders();
    const formBuffer = form.getBuffer();

    const res = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...formHeaders,
      },
      body: formBuffer,
    });

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

    const data = (await res.json()) as OpenRouterTranscriptionResponse;
    const text = data.text?.trim() ?? '';

    console.log('[audio-transcription] result', {
      textLength: text.length,
      text: text.slice(0, 100),
    });

    return { text };
  }
}
