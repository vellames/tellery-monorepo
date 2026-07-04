import { Lead } from '@prisma/client';
import { CreateLeadDto, UpdateLeadDto } from '../../types/domain/lead/lead.dto';
import { PrismaTransaction } from '../../types/database.types';
import { IBaseRepository } from './base.repository.interface';

export interface ILeadRepository extends IBaseRepository {
  create(data: CreateLeadDto, tx?: PrismaTransaction): Promise<Lead>;
  findById(id: string, tx?: PrismaTransaction): Promise<Lead | null>;
  findActiveByLocalUuid(
    localUuid: string,
    tx?: PrismaTransaction
  ): Promise<Lead | null>;
  update(
    id: string,
    data: UpdateLeadDto,
    tx?: PrismaTransaction
  ): Promise<Lead>;
  linkUser(
    leadId: string,
    userId: string,
    tx?: PrismaTransaction
  ): Promise<void>;
  softDelete(id: string, tx?: PrismaTransaction): Promise<void>;
}
