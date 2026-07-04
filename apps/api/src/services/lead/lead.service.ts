import { Lead } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { ILeadRepository } from '../../interfaces';
import {
  CreateLeadDto,
  LeadResponseDto,
  UpdateLeadDto,
} from '../../types/domain/lead/lead.dto';
import { HttpError } from '../../utils/http-error';

export class LeadService {
  constructor(private readonly leadRepository: ILeadRepository) {}

  async createOrGetActive(dto: CreateLeadDto): Promise<LeadResponseDto> {
    const existing = await this.leadRepository.findActiveByLocalUuid(
      dto.localUuid
    );
    if (existing) {
      return this.toResponseDto(existing);
    }

    const created = await this.leadRepository.create(dto);
    return this.toResponseDto(created);
  }

  async update(id: string, dto: UpdateLeadDto): Promise<LeadResponseDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new HttpError(
        StatusCodes.NOT_FOUND,
        'Lead not found',
        'lead:errors.notFound'
      );
    }

    const updated = await this.leadRepository.update(id, dto);
    return this.toResponseDto(updated);
  }

  async associateWithUser(leadId: string, userId: string): Promise<void> {
    try {
      const lead = await this.leadRepository.findById(leadId);
      if (!lead) {
        return;
      }
      await this.leadRepository.linkUser(leadId, userId);
    } catch {
      // Lead tracking must never break registration. Fail silently.
    }
  }

  private toResponseDto(lead: Lead): LeadResponseDto {
    return {
      id: lead.id,
      localUuid: lead.localUuid,
      queryParams: lead.queryParams,
      deviceInfo: lead.deviceInfo as Record<string, unknown> | null,
      name: lead.name,
      email: lead.email,
      isPasswordTouched: lead.isPasswordTouched,
      isConfirmPasswordTouched: lead.isConfirmPasswordTouched,
      isPrivacyAccepted: lead.isPrivacyAccepted,
      isTermsAccepted: lead.isTermsAccepted,
      userId: lead.userId,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }
}
