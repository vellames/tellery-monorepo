import { User } from '@prisma/client';
import { IUserRepository, IPasswordHasher } from '../../interfaces';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../../types/domain/user/user.dto';
import { HttpError } from '../../utils/http-error';

export class UserService {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async create(data: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.users.findByEmail(data.email);
    if (existing) {
      throw new HttpError(
        409,
        'Email already in use',
        'user:errors.emailAlreadyInUse'
      );
    }

    const hashedPassword = await this.passwordHasher.hash(data.password);
    const user = await this.users.create({ ...data, password: hashedPassword });
    return this.toResponseDto(user);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new HttpError(404, 'User not found', 'user:errors.userNotFound');
    }
    return this.toResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.users.findAll();
    return users.map((user) => this.toResponseDto(user));
  }

  async update(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new HttpError(404, 'User not found', 'user:errors.userNotFound');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.users.findByEmail(data.email);
      if (existing) {
        throw new HttpError(
          409,
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
      throw new HttpError(404, 'User not found', 'user:errors.userNotFound');
    }

    await this.users.softDelete(id);
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
