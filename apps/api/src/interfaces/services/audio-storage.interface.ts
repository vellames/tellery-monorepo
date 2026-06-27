export interface AudioUploadResult {
  key: string;
  bucket: string;
}

export interface IAudioStorage {
  upload(
    input: {
      sessionId: string;
      buffer: Buffer;
      contentType: string;
      extension: string;
    }
  ): Promise<AudioUploadResult>;
}
