import { User } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
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
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async create(data: CreateUserDto): Promise<UserResponseDto> {
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
    return this.toResponseDto(user);
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
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
