export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly messageKey?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}
