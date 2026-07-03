import fs from 'fs';
import path from 'path';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const DEFAULT_CONTENT_TYPE = 'image/jpeg';
const DEFAULT_EXPIRES_IN = 3600;

export interface UploadedReference {
  s3Key: string;
  url: string;
}

export interface UploadRequest {
  localPath: string;
  s3Key: string;
  contentType?: string;
}

/**
 * Standalone S3 uploader + presigner for creative video reference images.
 *
 * Mirrors the upload pattern from apps/api/src/services/audio/s3-audio-storage.ts
 * (PutObjectCommand with a Buffer body) and the presign pattern from
 * apps/api/src/services/image/s3-image-url-signer.ts (GetObjectCommand +
 * getSignedUrl), but without the DI container — credentials come straight from
 * env vars loaded by config.ts.
 */
export class S3ReferenceUploader {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly expiresIn: number;

  constructor(opts: {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket: string;
    expiresIn?: number;
  }) {
    this.s3 = new S3Client({
      region: opts.region,
      credentials: opts.accessKeyId
        ? {
            accessKeyId: opts.accessKeyId,
            secretAccessKey: opts.secretAccessKey as string,
          }
        : undefined,
    });
    this.bucket = opts.bucket;
    this.expiresIn = opts.expiresIn ?? DEFAULT_EXPIRES_IN;
  }

  static fromEnv(): S3ReferenceUploader {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error(
        'Missing required environment variable: AWS_S3_BUCKET (set it in .env, or pass --no-reference-images to skip reference images).'
      );
    }

    return new S3ReferenceUploader({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket,
      expiresIn: process.env.AWS_S3_PRESIGNED_EXPIRATION_SECONDS
        ? Number(process.env.AWS_S3_PRESIGNED_EXPIRATION_SECONDS)
        : undefined,
    });
  }

  async uploadAndSign(files: UploadRequest[]): Promise<UploadedReference[]> {
    const results: UploadedReference[] = [];
    for (const file of files) {
      await this.upload(file);
      const url = await this.presign(file.s3Key);
      results.push({ s3Key: file.s3Key, url });
    }
    return results;
  }

  private async upload(file: UploadRequest): Promise<void> {
    if (!fs.existsSync(file.localPath)) {
      throw new Error(`Reference image not found: ${file.localPath}`);
    }

    const body = fs.readFileSync(file.localPath);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: file.s3Key,
        Body: body,
        ContentType: file.contentType ?? DEFAULT_CONTENT_TYPE,
      })
    );
  }

  private async presign(s3Key: string): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: s3Key }),
      { expiresIn: this.expiresIn }
    );
  }
}

/**
 * Build the S3 key for a reference image under the ephemeral
 * creative-video-references/ prefix (kept separate from the production
 * histories/<slug>/... keys).
 */
export function buildReferenceKey(
  slug: string,
  category: string,
  key: string,
  ext = 'jpg'
): string {
  return path.join(
    'creative-video-references',
    slug,
    category,
    `${key}.${ext}`
  );
}
