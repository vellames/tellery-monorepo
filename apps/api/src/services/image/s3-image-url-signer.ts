import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IImageUrlSigner } from '../../interfaces';

export class S3ImageUrlSigner implements IImageUrlSigner {
  constructor(
    private readonly s3: S3Client,
    private readonly bucket: string,
    private readonly expiresIn: number
  ) {}

  async sign(imageKey: string | null): Promise<string | null> {
    if (!imageKey) {
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: imageKey,
    });

    return getSignedUrl(this.s3, command, { expiresIn: this.expiresIn });
  }
}
