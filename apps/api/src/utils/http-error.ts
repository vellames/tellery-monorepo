export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly messageKey?: string
  ) {
    super(message);
  }
}
