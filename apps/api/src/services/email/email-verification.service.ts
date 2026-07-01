import { SupportedLanguage } from '@ai-history/i18n';
import {
  IEmailTokenService,
  IEmailVerificationService,
  IMailer,
  VerificationRecipient,
  VerifiedToken,
} from '../../interfaces';
import {
  renderVerificationEmail,
  VerificationEmailTemplateParams,
} from './verification-email.template';

export interface EmailVerificationConfig {
  webBaseUrl: string;
  defaultLocale: SupportedLanguage;
}

type TranslateFn = (
  language: SupportedLanguage,
  key: string,
  params?: Record<string, string>,
  namespace?: string
) => string;

export class EmailVerificationService implements IEmailVerificationService {
  constructor(
    private readonly mailer: IMailer,
    private readonly tokenService: IEmailTokenService,
    private readonly translate: TranslateFn,
    private readonly config: EmailVerificationConfig
  ) {}

  async sendVerification(
    recipient: VerificationRecipient,
    locale: SupportedLanguage
  ): Promise<void> {
    const language = locale ?? this.config.defaultLocale;

    const token = this.tokenService.sign({
      sub: recipient.id,
      email: recipient.email,
    });
    const url = `${this.config.webBaseUrl}/verify-email?token=${encodeURIComponent(token)}&lang=${language}`;

    const templateParams: VerificationEmailTemplateParams = {
      brandName: this.translate(language, 'brandName', undefined, 'email'),
      brandTagline: this.translate(
        language,
        'brandTagline',
        undefined,
        'email'
      ),
      preheader: this.translate(language, 'preheader', undefined, 'email'),
      title: this.translate(language, 'title', undefined, 'email'),
      greeting: this.translate(
        language,
        'greeting',
        { name: recipient.name },
        'email'
      ),
      body: this.translate(language, 'body', undefined, 'email'),
      buttonText: this.translate(language, 'button', undefined, 'email'),
      footerNote: this.translate(language, 'footerNote', undefined, 'email'),
      footerCopyright: this.translate(
        language,
        'footerCopyright',
        { year: String(new Date().getFullYear()) },
        'email'
      ),
      url,
    };

    const subject = this.translate(
      language,
      'subject',
      { name: recipient.name },
      'email'
    );
    const text = [
      templateParams.title,
      '',
      templateParams.greeting,
      '',
      templateParams.body,
      '',
      url,
      '',
      templateParams.footerNote,
    ].join('\n');

    await this.mailer.send({
      to: recipient.email,
      subject,
      html: renderVerificationEmail(templateParams),
      text,
    });
  }

  verifyToken(token: string): VerifiedToken {
    return this.tokenService.verify(token);
  }
}
