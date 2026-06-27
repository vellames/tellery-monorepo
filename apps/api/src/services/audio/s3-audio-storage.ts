import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { IAudioStorage, AudioUploadResult } from '../../interfaces';

export class S3AudioStorage implements IAudioStorage {
  constructor(
    private readonly s3: S3Client,
    private readonly bucket: string
  ) {}

  async upload(input: {
    sessionId: string;
    buffer: Buffer;
    contentType: string;
    extension: string;
  }): Promise<AudioUploadResult> {
    const id = randomUUID();
    const key = `sessions/${input.sessionId}/${id}.${input.extension}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.contentType,
      })
    );

    return { key, bucket: this.bucket };
  }
}
