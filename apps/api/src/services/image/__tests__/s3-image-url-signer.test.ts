import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3ImageUrlSigner } from '../s3-image-url-signer';

jest.mock('@aws-sdk/s3-request-presigner');

const mockedGetSignedUrl = jest.mocked(getSignedUrl);

describe('S3ImageUrlSigner', () => {
  let s3: S3Client;
  let signer: S3ImageUrlSigner;

  beforeEach(() => {
    s3 = {} as S3Client;
    signer = new S3ImageUrlSigner(s3, 'my-bucket', 3600);
    mockedGetSignedUrl.mockReset();
  });

  it('returns null when the image key is null', async () => {
    const result = await signer.sign(null);

    expect(result).toBeNull();
    expect(mockedGetSignedUrl).not.toHaveBeenCalled();
  });

  it('returns null when the image key is an empty string', async () => {
    const result = await signer.sign('');

    expect(result).toBeNull();
    expect(mockedGetSignedUrl).not.toHaveBeenCalled();
  });

  it('builds a presigned url for the given key, bucket and expiration', async () => {
    const signed = 'https://s3.us-east-1.amazonaws.com/my-bucket/cover.png?X-Amz-...';
    mockedGetSignedUrl.mockResolvedValue(signed);

    const result = await signer.sign('histories/o-bilhete-na-mesa-7/history/cover.png');

    expect(result).toBe(signed);
    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1);
    const [client, command, options] = mockedGetSignedUrl.mock.calls[0];
    expect(client).toBe(s3);
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect((command as GetObjectCommand).input).toEqual({
      Bucket: 'my-bucket',
      Key: 'histories/o-bilhete-na-mesa-7/history/cover.png',
    });
    expect(options).toEqual({ expiresIn: 3600 });
  });
});
