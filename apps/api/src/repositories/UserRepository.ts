import { PrismaClient, User } from '@prisma/client';
import { IUserRepository } from '../interfaces';
import { CreateUserDto, UpdateUserDto } from '../types/domain/user/user.dto';
import { PrismaTransaction } from '../types/database.types';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository implements IUserRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: CreateUserDto, tx?: PrismaTransaction): Promise<User> {
    const client = tx || this.prisma;
    return client.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });
  }

  async findById(id: string, tx?: PrismaTransaction): Promise<User | null> {
    const client = tx || this.prisma;
    return client.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(
    email: string,
    tx?: PrismaTransaction
  ): Promise<User | null> {
    const client = tx || this.prisma;
    return client.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findAll(tx?: PrismaTransaction): Promise<User[]> {
    const client = tx || this.prisma;
    return client.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    data: UpdateUserDto,
    tx?: PrismaTransaction
  ): Promise<User> {
    const client = tx || this.prisma;
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
    } = {};

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = data.password;

    return client.user.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string, tx?: PrismaTransaction): Promise<void> {
    const client = tx || this.prisma;
    await client.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async decrementAvailableCredits(
    id: string,
    tx?: PrismaTransaction
  ): Promise<boolean> {
    const client = tx || this.prisma;
    const result = await client.user.updateMany({
      where: { id, availableCredits: { gt: 0 }, deletedAt: null },
      data: { availableCredits: { decrement: 1 } },
    });
    return result.count > 0;
  }
}
