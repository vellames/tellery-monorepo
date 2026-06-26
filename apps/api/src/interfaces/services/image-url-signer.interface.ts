export interface IImageUrlSigner {
  sign(imageKey: string | null): Promise<string | null>;
}
