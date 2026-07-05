import { User } from '@prisma/client';
import {
  ConvertTemporaryUserDto,
  CreateTemporaryUserDto,
  CreateUserDto,
  UpdateUserDto,
} from '../../types/domain/user/user.dto';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface IUserRepository extends IBaseRepository {
  create(data: CreateUserDto, tx?: PrismaTransaction): Promise<User>;
  createTemporary(
    data: CreateTemporaryUserDto,
    tx?: PrismaTransaction
  ): Promise<User>;
  convertToPermanent(
    id: string,
    data: ConvertTemporaryUserDto,
    tx?: PrismaTransaction
  ): Promise<User>;
  findTemporaryById(id: string, tx?: PrismaTransaction): Promise<User | null>;
  findById(id: string, tx?: PrismaTransaction): Promise<User | null>;
  findByEmail(email: string, tx?: PrismaTransaction): Promise<User | null>;
  findAll(tx?: PrismaTransaction): Promise<User[]>;
  update(
    id: string,
    data: UpdateUserDto,
    tx?: PrismaTransaction
  ): Promise<User>;
  decrementAvailableCredits(
    id: string,
    tx?: PrismaTransaction
  ): Promise<boolean>;
  setAvailableCredits(
    id: string,
    amount: number,
    tx?: PrismaTransaction
  ): Promise<void>;
  markEmailVerified(id: string, tx?: PrismaTransaction): Promise<User>;
  softDelete(id: string, tx?: PrismaTransaction): Promise<void>;
}
