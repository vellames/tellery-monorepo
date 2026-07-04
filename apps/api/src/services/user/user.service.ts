import { User } from '@prisma/client';
import { cpf } from 'cpf-cnpj-validator';
import { StatusCodes } from 'http-status-codes';
import { SupportedLanguage } from '@ai-history/i18n';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  IEmailVerificationService,
  ILeadRepository,
} from '../../interfaces';
import {
  AvailableCreditsResponseDto,
  AuthResponseDto,
  CreateUserDto,
  LoginDto,
  UpdateUserDto,
  UserResponseDto,
} from '../../types/domain/user/user.dto';
import { HttpError } from '../../utils/http-error';

export class UserService {
  constructor(
    private readonly users: IUserRepository,
    private readonly leads: ILeadRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly emailVerification: IEmailVerificationService
  ) {}

  async create(
    data: CreateUserDto,
    locale: SupportedLanguage = 'pt-BR',
    leadId?: string
  ): Promise<AuthResponseDto> {
    const existing = await this.users.findByEmail(data.email);
    if (existing) {
      throw new HttpError(
        StatusCodes.CONFLICT,
        'Email already in use',
        'user:errors.emailAlreadyInUse'
      );
    }

    const hashedPassword = await this.passwordHasher.hash(data.password);
    const user = await this.users.create({ ...data, password: hashedPassword });
    const token = this.tokenService.sign({ sub: user.id, email: user.email });

    this.emailVerification
      .sendVerification(
        { id: user.id, email: user.email, name: user.name },
        locale
      )
      .catch((error) => {
        console.error('[email] failed to send verification', error);
      });

    if (leadId) {
      try {
        await this.leads.linkUser(leadId, user.id);
      } catch (error) {
        console.error('[lead] failed to link lead to user', error);
      }
    }

    return { user: this.toResponseDto(user), token };
  }

  async login(data: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(data.email);
    if (!user) {
      throw new HttpError(
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password',
        'user:errors.invalidCredentials'
      );
    }

    const valid = await this.passwordHasher.compare(
      data.password,
      user.password
    );
    if (!valid) {
      throw new HttpError(
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password',
        'user:errors.invalidCredentials'
      );
    }

    const token = this.tokenService.sign({ sub: user.id, email: user.email });
    return { user: this.toResponseDto(user), token };
  }

  async verifyEmail(token: string): Promise<UserResponseDto> {
    const { sub } = this.emailVerification.verifyToken(token);
    const user = await this.users.findById(sub);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'User not found',
        'user:errors.userNotFound'
      );
    }
    if (user.emailVerifiedAt) {
      throw new HttpError(
        StatusCodes.CONFLICT,
        'Email is already verified',
        'user:errors.emailAlreadyVerified'
      );
    }
    const updated = await this.users.markEmailVerified(sub);
    return this.toResponseDto(updated);
  }

  async resendEmailVerification(
    userId: string,
    locale: SupportedLanguage = 'pt-BR'
  ): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'User not found',
        'user:errors.userNotFound'
      );
    }
    if (user.emailVerifiedAt) {
      throw new HttpError(
        StatusCodes.CONFLICT,
        'Email is already verified',
        'user:errors.emailAlreadyVerified'
      );
    }
    await this.emailVerification.sendVerification(
      { id: user.id, email: user.email, name: user.name },
      locale
    );
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'User not found',
        'user:errors.userNotFound'
      );
    }
    return this.toResponseDto(user);
  }

  async getAvailableCredits(id: string): Promise<AvailableCreditsResponseDto> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'User not found',
        'user:errors.userNotFound'
      );
    }
    return { availableCredits: user.availableCredits };
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.users.findAll();
    return users.map((user) => this.toResponseDto(user));
  }

  async update(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'User not found',
        'user:errors.userNotFound'
      );
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.users.findByEmail(data.email);
      if (existing) {
        throw new HttpError(
          StatusCodes.CONFLICT,
          'Email already in use',
          'user:errors.emailAlreadyInUse'
        );
      }
    }

    const updateData: UpdateUserDto = { ...data };
    if ('ssn' in updateData) {
      updateData.ssn = this.normalizeCpf(updateData.ssn);
    }

    if (data.password) {
      updateData.password = await this.passwordHasher.hash(data.password);
    }

    const updated = await this.users.update(id, updateData);
    return this.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'User not found',
        'user:errors.userNotFound'
      );
    }

    await this.users.softDelete(id);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'User not found',
        'user:errors.userNotFound'
      );
    }

    const valid = await this.passwordHasher.compare(
      currentPassword,
      user.password
    );
    if (!valid) {
      throw new HttpError(
        StatusCodes.UNAUTHORIZED,
        'Current password is incorrect',
        'user:errors.currentPasswordIncorrect'
      );
    }

    const hashedPassword = await this.passwordHasher.hash(newPassword);
    await this.users.update(id, { password: hashedPassword });
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      ssn: user.ssn,
      emailVerifiedAt: user.emailVerifiedAt
        ? user.emailVerifiedAt.toISOString()
        : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private normalizeCpf(value: string | null | undefined): string | null {
    if (value === null || value === undefined || value.trim() === '') {
      return null;
    }

    if (!cpf.isValid(value)) {
      throw new HttpError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'Invalid SSN',
        'user:errors.invalidSsn'
      );
    }

    return cpf.strip(value);
  }
}
