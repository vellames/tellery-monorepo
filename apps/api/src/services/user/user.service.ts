import { User, UserAddress } from '@prisma/client';
import { cpf } from 'cpf-cnpj-validator';
import { StatusCodes } from 'http-status-codes';
import { SupportedLanguage } from '@ai-history/i18n';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  IEmailVerificationService,
  ILeadRepository,
  IUserAddressRepository,
} from '../../interfaces';
import {
  AvailableCreditsResponseDto,
  AuthResponseDto,
  ConvertTemporaryUserDto,
  CreateUserDto,
  LoginDto,
  UpdateUserAddressDto,
  UpdateUserDto,
  UserAddressResponseDto,
  UserResponseDto,
} from '../../types/domain/user/user.dto';
import { HttpError } from '../../utils/http-error';

const ZIP_CODE_LENGTH = 8;

export class UserService {
  constructor(
    private readonly users: IUserRepository,
    private readonly leads: ILeadRepository,
    private readonly addresses: IUserAddressRepository,
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
    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email ?? '',
    });

    this.emailVerification
      .sendVerification(
        { id: user.id, email: user.email ?? '', name: user.name },
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
      user.password ?? ''
    );
    if (!valid) {
      throw new HttpError(
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password',
        'user:errors.invalidCredentials'
      );
    }

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email ?? '',
    });
    const address = await this.addresses.findByUserId(user.id);
    return { user: this.toResponseDto(user, address), token };
  }

  async createTemporary(
    name: string,
    leadId?: string
  ): Promise<AuthResponseDto> {
    const user = await this.users.createTemporary({ name });
    const token = this.tokenService.sign({ sub: user.id, email: '' });

    if (leadId) {
      try {
        await this.leads.linkUser(leadId, user.id);
      } catch (error) {
        console.error('[lead] failed to link lead to temp user', error);
      }
    }

    return { user: this.toResponseDto(user), token };
  }

  async convertTemporary(
    userId: string,
    data: ConvertTemporaryUserDto,
    locale: SupportedLanguage = 'pt-BR'
  ): Promise<AuthResponseDto> {
    const tempUser = await this.users.findTemporaryById(userId);
    if (!tempUser) {
      throw new HttpError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'Account is not temporary',
        'user:errors.notTemporary'
      );
    }

    const existing = await this.users.findByEmail(data.email);
    if (existing && existing.id !== userId) {
      throw new HttpError(
        StatusCodes.CONFLICT,
        'Email already in use',
        'user:errors.emailAlreadyInUse'
      );
    }

    const hashedPassword = await this.passwordHasher.hash(data.password);
    const converted = await this.users.convertToPermanent(userId, {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });
    const token = this.tokenService.sign({
      sub: converted.id,
      email: converted.email ?? '',
    });

    this.emailVerification
      .sendVerification(
        {
          id: converted.id,
          email: converted.email ?? '',
          name: converted.name,
        },
        locale
      )
      .catch((error) => {
        console.error('[email] failed to send verification', error);
      });

    const address = await this.addresses.findByUserId(converted.id);
    return { user: this.toResponseDto(converted, address), token };
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
    const address = await this.addresses.findByUserId(sub);
    return this.toResponseDto(updated, address);
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
      { id: user.id, email: user.email ?? '', name: user.name },
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
    const address = await this.addresses.findByUserId(id);
    return this.toResponseDto(user, address);
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

    const { address, ...rest } = data;
    const updateData: UpdateUserDto = { ...rest };
    if ('ssn' in updateData) {
      updateData.ssn = this.normalizeCpf(updateData.ssn);
    }

    const normalizedAddress = address
      ? this.normalizeAddress(address)
      : undefined;

    if (data.password) {
      updateData.password = await this.passwordHasher.hash(data.password);
    }

    const updated = await this.users.update(id, updateData);

    const addressRecord = normalizedAddress
      ? await this.addresses.upsertByUserId(id, normalizedAddress)
      : await this.addresses.findByUserId(id);

    return this.toResponseDto(updated, addressRecord);
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
      user.password ?? ''
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

  private toResponseDto(
    user: User,
    address: UserAddress | null = null
  ): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      ssn: user.ssn,
      address: address ? this.toAddressResponseDto(address) : null,
      emailVerifiedAt: user.emailVerifiedAt
        ? user.emailVerifiedAt.toISOString()
        : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private toAddressResponseDto(address: UserAddress): UserAddressResponseDto {
    return {
      zipCode: address.zipCode,
      street: address.street,
      state: address.state,
      city: address.city,
      neighborhood: address.neighborhood,
      number: address.number,
      complement: address.complement,
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

  private normalizeAddress(
    address: UpdateUserAddressDto
  ): UpdateUserAddressDto {
    const zipCode = address.zipCode.replace(/\D/g, '');
    if (zipCode.length !== ZIP_CODE_LENGTH) {
      throw new HttpError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'Invalid zip code',
        'user:errors.invalidZipCode'
      );
    }

    return {
      zipCode,
      street: address.street,
      state: address.state,
      city: address.city,
      neighborhood: address.neighborhood,
      number: address.number ?? null,
      complement: address.complement ?? null,
    };
  }
}
