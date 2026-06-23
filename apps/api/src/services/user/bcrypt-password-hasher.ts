import bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../interfaces';

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly saltRounds: number) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
