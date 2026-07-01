import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { EmailVerificationService } from '../email-verification.service';
import {
  IMailer,
  IEmailTokenService,
  SendMailInput,
} from '../../../interfaces';

type TranslateFn = (
  language: string,
  key: string,
  params?: Record<string, string>
) => string;

const translate: TranslateFn = (_lang, key, params) =>
  params?.name ? `${key}:${params.name}` : key;

describe('EmailVerificationService', () => {
  let mailer: DeepMockProxy<IMailer>;
  let tokenService: DeepMockProxy<IEmailTokenService>;
  let service: EmailVerificationService;

  beforeEach(() => {
    mailer = mockDeep<IMailer>();
    tokenService = mockDeep<IEmailTokenService>();
    tokenService.sign.mockReturnValue('signed-token');
    service = new EmailVerificationService(
      mailer,
      tokenService,
      translate as never,
      {
        webBaseUrl: 'https://app.example.com',
        defaultLocale: 'pt-BR',
      }
    );
  });

  afterEach(() => {
    mockReset(mailer);
    mockReset(tokenService);
  });

  const recipient = {
    id: 'user-1',
    email: 'ana@teste.local',
    name: 'Ana',
  };

  describe('sendVerification', () => {
    it('signs a token and sends a branded email to the user', async () => {
      await service.sendVerification(recipient, 'en');

      expect(tokenService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'ana@teste.local',
      });

      expect(mailer.send).toHaveBeenCalledTimes(1);
      const input = (mailer.send as jest.Mock).mock
        .calls[0][0] as SendMailInput;
      expect(input.to).toBe('ana@teste.local');
      expect(input.subject).toBe('subject:Ana');
      expect(input.html).toContain('title');
      expect(input.html).toContain('button');
    });

    it('builds the verification url with the token and locale', async () => {
      await service.sendVerification(recipient, 'en');

      const input = (mailer.send as jest.Mock).mock
        .calls[0][0] as SendMailInput;
      expect(input.text).toContain(
        'https://app.example.com/verify-email?token=signed-token&lang=en'
      );
    });

    it('falls back to the default locale when none is provided', async () => {
      await service.sendVerification(recipient, undefined as never);

      const input = (mailer.send as jest.Mock).mock
        .calls[0][0] as SendMailInput;
      expect(input.text).toContain('lang=pt-BR');
    });
  });

  describe('verifyToken', () => {
    it('delegates to the token service', () => {
      tokenService.verify.mockReturnValue({
        sub: 'user-1',
        email: 'ana@teste.local',
      });

      const result = service.verifyToken('some-token');

      expect(tokenService.verify).toHaveBeenCalledWith('some-token');
      expect(result.sub).toBe('user-1');
    });
  });
});
