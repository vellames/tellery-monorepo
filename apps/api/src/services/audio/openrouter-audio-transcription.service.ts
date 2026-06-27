import { appConfig } from '../../config/app.config';
import { IAudioTranscriptionService } from '../../interfaces';

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
    const formData = new FormData();
    const uint8 = new Uint8Array(input.buffer);
    formData.append(
      'file',
      new Blob([uint8], { type: input.contentType }),
      input.filename
    );
    formData.append('model', this.model);

    console.log('[audio-transcription] sending to openrouter', {
      model: this.model,
      bufferSize: input.buffer.length,
      contentType: input.contentType,
    });

    const res = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
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
