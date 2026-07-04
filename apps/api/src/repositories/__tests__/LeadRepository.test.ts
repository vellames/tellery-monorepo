import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { LeadRepository } from '../LeadRepository';

type PrismaLead = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  localUuid: string;
  queryParams: string | null;
  name: string | null;
  email: string | null;
  isPasswordTouched: boolean;
  isConfirmPasswordTouched: boolean;
  isPrivacyAccepted: boolean;
  isTermsAccepted: boolean;
  userId: string | null;
};

const mockLead = (overrides: Partial<PrismaLead> = {}): PrismaLead => ({
  id: 'lead-1',
  createdAt: new Date('2026-07-01'),
  updatedAt: new Date('2026-07-01'),
  deletedAt: null,
  localUuid: 'browser-uuid-1',
  queryParams: null,
  name: null,
  email: null,
  isPasswordTouched: false,
  isConfirmPasswordTouched: false,
  isPrivacyAccepted: false,
  isTermsAccepted: false,
  userId: null,
  ...overrides,
});

describe('LeadRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repo: LeadRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new LeadRepository(prisma);
  });

  afterEach(() => {
    mockReset(prisma);
  });

  describe('create', () => {
    it('should create a lead with the provided data', async () => {
      const input = { localUuid: 'browser-uuid-1', queryParams: '?ref=x' };
      const created = mockLead(input);
      prisma.lead.create.mockResolvedValue(created);

      const result = await repo.create(input);

      expect(result).toEqual(created);
      expect(prisma.lead.create).toHaveBeenCalledWith({
        data: {
          localUuid: input.localUuid,
          queryParams: input.queryParams,
        },
      });
    });

    it('should omit queryParams when not provided', async () => {
      const created = mockLead({ queryParams: null });
      prisma.lead.create.mockResolvedValue(created);

      await repo.create({ localUuid: 'browser-uuid-1' });

      expect(prisma.lead.create).toHaveBeenCalledWith({
        data: {
          localUuid: 'browser-uuid-1',
          queryParams: undefined,
        },
      });
    });

    it('should forward the transaction when provided', async () => {
      const tx = {
        lead: { create: jest.fn().mockResolvedValue(mockLead()) },
      };
      prisma.lead.create.mockResolvedValue(mockLead());

      await repo.create({ localUuid: 'browser-uuid-1' }, tx as never);

      expect(tx.lead.create).toHaveBeenCalled();
      expect(prisma.lead.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find a non-deleted lead by id', async () => {
      const lead = mockLead();
      prisma.lead.findFirst.mockResolvedValue(lead);

      const result = await repo.findById('lead-1');

      expect(result).toEqual(lead);
      expect(prisma.lead.findFirst).toHaveBeenCalledWith({
        where: { id: 'lead-1', deletedAt: null },
      });
    });

    it('should return null when lead is not found', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findActiveByLocalUuid', () => {
    it('should find a non-converted, non-deleted lead by localUuid', async () => {
      const lead = mockLead();
      prisma.lead.findFirst.mockResolvedValue(lead);

      const result = await repo.findActiveByLocalUuid('browser-uuid-1');

      expect(result).toEqual(lead);
      expect(prisma.lead.findFirst).toHaveBeenCalledWith({
        where: {
          localUuid: 'browser-uuid-1',
          userId: null,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return null when no active lead exists', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);

      const result = await repo.findActiveByLocalUuid('browser-uuid-1');

      expect(result).toBeNull();
    });

    it('should forward the transaction when provided', async () => {
      const tx = {
        lead: { findFirst: jest.fn().mockResolvedValue(mockLead()) },
      };

      await repo.findActiveByLocalUuid('browser-uuid-1', tx as never);

      expect(tx.lead.findFirst).toHaveBeenCalled();
      expect(prisma.lead.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update only provided fields', async () => {
      const updated = mockLead({ name: 'Ana', isTermsAccepted: true });
      prisma.lead.update.mockResolvedValue(updated);

      const result = await repo.update('lead-1', {
        name: 'Ana',
        isTermsAccepted: true,
      });

      expect(result).toEqual(updated);
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { name: 'Ana', isTermsAccepted: true },
      });
    });

    it('should not include undefined fields in update data', async () => {
      prisma.lead.update.mockResolvedValue(mockLead());

      await repo.update('lead-1', { name: 'Ana' });

      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { name: 'Ana' },
      });
    });
  });

  describe('linkUser', () => {
    it('should set userId on the lead', async () => {
      prisma.lead.update.mockResolvedValue(mockLead({ userId: 'user-1' }));

      await repo.linkUser('lead-1', 'user-1');

      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { userId: 'user-1' },
      });
    });

    it('should forward the transaction when provided', async () => {
      const tx = {
        lead: { update: jest.fn().mockResolvedValue(mockLead()) },
      };

      await repo.linkUser('lead-1', 'user-1', tx as never);

      expect(tx.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { userId: 'user-1' },
      });
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt instead of removing the record', async () => {
      prisma.lead.update.mockResolvedValue(mockLead());

      await repo.softDelete('lead-1');

      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
