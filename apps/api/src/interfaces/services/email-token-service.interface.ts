export interface EmailTokenPayload {
  sub: string;
  email: string;
  purpose: 'email_verification';
}

export interface IEmailTokenService {
  sign(payload: { sub: string; email: string }): string;
  verify(token: string): { sub: string; email: string };
}
