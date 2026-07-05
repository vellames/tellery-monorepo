/**
 * Minimal raw-fetch client for ElevenLabs Text-to-Speech.
 *
 * Endpoint: POST /v1/text-to-speech/{voice_id}?output_format=mp3_44100_128
 * Auth: xi-api-key header. Response: raw MP3 bytes (application/octet-stream).
 *
 * No SDK — a single synchronous POST is all this app needs. Schema verified
 * against the official ElevenLabs OpenAPI spec (July 2026).
 */
const BASE_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128';
const DEFAULT_LANGUAGE_CODE = 'pt';

export interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  speed: number;
}

export class ElevenLabsClient {
  constructor(
    private readonly apiKey: string,
    private readonly voiceId: string,
    private readonly model: string
  ) {}

  async generateSpeech(text: string, settings: VoiceSettings): Promise<Buffer> {
    const url = `${BASE_URL}/text-to-speech/${this.voiceId}?output_format=${DEFAULT_OUTPUT_FORMAT}`;
    const body = {
      text,
      model_id: this.model,
      language_code: DEFAULT_LANGUAGE_CODE,
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarityBoost,
        style: settings.style,
        use_speaker_boost: settings.useSpeakerBoost,
        speed: settings.speed,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `ElevenLabs TTS failed (${response.status}): ${await this.readError(response)}`
      );
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private async readError(response: Response): Promise<string> {
    const text = await response.text();
    if (!text) {
      switch (response.status) {
        case 401:
          return 'invalid or missing API key';
        case 402:
          return 'insufficient credits';
        case 404:
          return `voice not found: ${this.voiceId}`;
        case 429:
          return 'rate limit exceeded (retry with backoff)';
        default:
          return '(empty body)';
      }
    }
    return text.slice(0, 500);
  }
}
