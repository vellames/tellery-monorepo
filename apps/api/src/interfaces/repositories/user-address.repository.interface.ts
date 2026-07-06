import { UserAddress } from '@prisma/client';
import { UpdateUserAddressDto } from '../../types/domain/user/user.dto';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface IUserAddressRepository extends IBaseRepository {
  findByUserId(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<UserAddress | null>;
  upsertByUserId(
    userId: string,
    data: UpdateUserAddressDto,
    tx?: PrismaTransaction
  ): Promise<UserAddress>;
}
