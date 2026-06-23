import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../../interfaces';
import { HttpError } from '../../utils/http-error';
import { StatusCodes } from 'http-status-codes';

export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  verify(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
    }
  }
}
