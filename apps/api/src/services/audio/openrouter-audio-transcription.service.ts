import { appConfig } from '../../config/app.config';
import { IAudioTranscriptionService } from '../../interfaces';
import FormData from 'form-data';

interface TranscriptionResponse {
  text: string;
}

export class OpenRouterAudioTranscriptionService
  implements IAudioTranscriptionService
{
  async transcribe(input: {
    buffer: Buffer;
    contentType: string;
    filename: string;
  }): Promise<{ text: string }> {
    const apiKey = appConfig.openai.apiKey;
    const model = appConfig.openrouter.audioModel;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured for audio transcription');
    }

    const form = new FormData();
    form.append('file', input.buffer, {
      filename: input.filename,
      contentType: input.contentType,
    });
    form.append('model', model);
    form.append('language', 'pt');

    console.log('[audio-transcription] sending to openai', {
      model,
      bufferSize: input.buffer.length,
      contentType: input.contentType,
    });

    const formHeaders = form.getHeaders();
    const formBuffer = form.getBuffer();

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...formHeaders,
      },
      body: formBuffer,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'unknown');
      console.error('[audio-transcription] openai error', {
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
    });

    return { text };
  }
}
