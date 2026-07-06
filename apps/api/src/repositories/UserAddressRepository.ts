import { PrismaClient, UserAddress } from '@prisma/client';
import { IUserAddressRepository } from '../interfaces';
import { UpdateUserAddressDto } from '../types/domain/user/user.dto';
import { PrismaTransaction } from '../types/database.types';
import { BaseRepository } from './base.repository';

export class UserAddressRepository
  extends BaseRepository
  implements IUserAddressRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByUserId(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<UserAddress | null> {
    const client = tx || this.prisma;
    return client.userAddress.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  async upsertByUserId(
    userId: string,
    data: UpdateUserAddressDto,
    tx?: PrismaTransaction
  ): Promise<UserAddress> {
    const client = tx || this.prisma;
    const addressData = {
      zipCode: data.zipCode,
      street: data.street,
      state: data.state,
      city: data.city,
      neighborhood: data.neighborhood,
      number: data.number ?? null,
      complement: data.complement ?? null,
    };

    return client.userAddress.upsert({
      where: { userId },
      create: { userId, ...addressData },
      update: addressData,
    });
  }
}
