import { PrismaClient, Lead, Prisma } from '@prisma/client';
import { ILeadRepository } from '../interfaces';
import { CreateLeadDto, UpdateLeadDto } from '../types/domain/lead/lead.dto';
import { PrismaTransaction } from '../types/database.types';
import { BaseRepository } from './base.repository';

export class LeadRepository extends BaseRepository implements ILeadRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: CreateLeadDto, tx?: PrismaTransaction): Promise<Lead> {
    const client = tx || this.prisma;
    return client.lead.create({
      data: {
        localUuid: data.localUuid,
        queryParams: data.queryParams,
        deviceInfo: data.deviceInfo as Prisma.InputJsonValue,
      },
    });
  }

  async findById(id: string, tx?: PrismaTransaction): Promise<Lead | null> {
    const client = tx || this.prisma;
    return client.lead.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findActiveByLocalUuid(
    localUuid: string,
    tx?: PrismaTransaction
  ): Promise<Lead | null> {
    const client = tx || this.prisma;
    return client.lead.findFirst({
      where: { localUuid, userId: null, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    data: UpdateLeadDto,
    tx?: PrismaTransaction
  ): Promise<Lead> {
    const client = tx || this.prisma;
    const updateData: NonNullable<UpdateLeadDto> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.isFirstInputFocus !== undefined)
      updateData.isFirstInputFocus = data.isFirstInputFocus;
    if (data.isPasswordTouched !== undefined)
      updateData.isPasswordTouched = data.isPasswordTouched;
    if (data.isConfirmPasswordTouched !== undefined)
      updateData.isConfirmPasswordTouched = data.isConfirmPasswordTouched;
    if (data.isPrivacyAccepted !== undefined)
      updateData.isPrivacyAccepted = data.isPrivacyAccepted;
    if (data.isTermsAccepted !== undefined)
      updateData.isTermsAccepted = data.isTermsAccepted;

    return client.lead.update({
      where: { id },
      data: updateData,
    });
  }

  async linkUser(
    leadId: string,
    userId: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = tx || this.prisma;
    await client.lead.update({
      where: { id: leadId },
      data: { userId },
    });
  }

  async softDelete(id: string, tx?: PrismaTransaction): Promise<void> {
    const client = tx || this.prisma;
    await client.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
