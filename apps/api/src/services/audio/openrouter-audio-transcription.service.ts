import { appConfig } from '../../config/app.config';
import { IAudioTranscriptionService } from '../../interfaces';

interface TranscriptionResponse {
  text: string;
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
  async transcribe(input: {
    buffer: Buffer;
    contentType: string;
    filename: string;
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
    });

    return { text };
  }
}
