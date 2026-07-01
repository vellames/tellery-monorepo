import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { IEmailTokenService } from '../../interfaces';
import { HttpError } from '../../utils/http-error';

const VERIFICATION_PURPOSE = 'email_verification';

export class EmailTokenService implements IEmailTokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string
  ) {}

  sign(payload: { sub: string; email: string }): string {
    return jwt.sign(
      { ...payload, purpose: VERIFICATION_PURPOSE },
      this.secret,
      {
        expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
      }
    );
  }

  verify(token: string): { sub: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.secret) as {
        sub: string;
        email: string;
        purpose?: string;
      };
      if (decoded.purpose !== VERIFICATION_PURPOSE) {
        throw new Error('invalid purpose');
      }
      return { sub: decoded.sub, email: decoded.email };
    } catch {
      throw new HttpError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'Invalid or expired verification token',
        'user:errors.invalidVerificationToken'
      );
    }
  }
}
