export interface AudioTranscriptionResult {
  text: string;
}

export interface IAudioTranscriptionService {
  transcribe(input: {
    buffer: Buffer;
    contentType: string;
    filename: string;
  }): Promise<AudioTranscriptionResult>;
}
