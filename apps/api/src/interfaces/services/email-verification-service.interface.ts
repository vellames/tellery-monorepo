import { SupportedLanguage } from '@ai-history/i18n';

export interface VerificationRecipient {
  id: string;
  email: string;
  name: string;
}

export interface VerifiedToken {
  sub: string;
  email: string;
}

export interface IEmailVerificationService {
  sendVerification(
    recipient: VerificationRecipient,
    locale: SupportedLanguage
  ): Promise<void>;
  verifyToken(token: string): VerifiedToken;
}
