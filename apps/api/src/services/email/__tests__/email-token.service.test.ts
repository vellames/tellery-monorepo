import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { EmailTokenService } from '../email-token.service';
import { HttpError } from '../../../utils/http-error';

const SECRET = 'test-email-secret-min-16-chars';
const EXPIRES_IN = '1h';

describe('EmailTokenService', () => {
  let service: EmailTokenService;

  beforeEach(() => {
    service = new EmailTokenService(SECRET, EXPIRES_IN);
  });

  it('signs a verifiable token for a user', () => {
    const token = service.sign({ sub: 'user-1', email: 'ana@teste.local' });

    expect(token).toBeTruthy();
    const decoded = service.verify(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('ana@teste.local');
  });

  it('throws a 422 HttpError when the token is invalid', () => {
    expect(() => service.verify('not-a-jwt')).toThrow(HttpError);
    try {
      service.verify('not-a-jwt');
    } catch (error) {
      expect((error as HttpError).statusCode).toBe(
        StatusCodes.UNPROCESSABLE_ENTITY
      );
    }
  });

  it('throws a 422 HttpError when the signature was tampered with', () => {
    const token = service.sign({ sub: 'user-1', email: 'ana@teste.local' });
    const tampered = `${token.slice(0, -4)}XXXX`;

    expect(() => service.verify(tampered)).toThrow(HttpError);
  });

  it('rejects tokens signed without the email_verification purpose', () => {
    const foreignToken = jwt.sign(
      { sub: 'user-1', email: 'ana@teste.local', purpose: 'something-else' },
      SECRET,
      { expiresIn: EXPIRES_IN }
    );

    expect(() => service.verify(foreignToken)).toThrow(HttpError);
  });
});
