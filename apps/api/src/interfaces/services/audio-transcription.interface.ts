export interface AudioTranscriptionResult {
  text: string;
}

export interface AudioTranscriptionInput {
  buffer: Buffer;
  contentType: string;
  filename: string;
  sessionId?: string;
}

export interface IAudioTranscriptionService {
  transcribe(input: AudioTranscriptionInput): Promise<AudioTranscriptionResult>;
}
