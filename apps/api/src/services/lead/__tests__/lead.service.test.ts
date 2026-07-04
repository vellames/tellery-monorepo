import { Lead } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { ILeadRepository } from '../../../interfaces';
import { LeadService } from '../lead.service';
import { StatusCodes } from 'http-status-codes';

const mockLead = (overrides: Partial<Lead> = {}): Lead => ({
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

describe('LeadService', () => {
  let repo: DeepMockProxy<ILeadRepository>;
  let service: LeadService;

  beforeEach(() => {
    repo = mockDeep<ILeadRepository>();
    service = new LeadService(repo);
  });

  afterEach(() => {
    mockReset(repo);
  });

  describe('createOrGetActive', () => {
    it('should return the existing active lead without creating a new one', async () => {
      const existing = mockLead({ id: 'existing-lead' });
      repo.findActiveByLocalUuid.mockResolvedValue(existing);

      const result = await service.createOrGetActive({
        localUuid: 'browser-uuid-1',
        queryParams: '?ref=x',
      });

      expect(result.id).toBe('existing-lead');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should create a new lead when no active lead exists', async () => {
      repo.findActiveByLocalUuid.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockLead({ id: 'new-lead' }));

      const result = await service.createOrGetActive({
        localUuid: 'browser-uuid-1',
        queryParams: '?ref=x',
      });

      expect(result.id).toBe('new-lead');
      expect(repo.create).toHaveBeenCalledWith({
        localUuid: 'browser-uuid-1',
        queryParams: '?ref=x',
      });
    });

    it('should map queryParams to null when omitted in the response', async () => {
      repo.findActiveByLocalUuid.mockResolvedValue(
        mockLead({ queryParams: null })
      );

      const result = await service.createOrGetActive({
        localUuid: 'browser-uuid-1',
      });

      expect(result.queryParams).toBeNull();
    });

    it('should serialize dates to ISO strings in the response', async () => {
      repo.findActiveByLocalUuid.mockResolvedValue(mockLead());

      const result = await service.createOrGetActive({
        localUuid: 'browser-uuid-1',
      });

      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
    });
  });

  describe('update', () => {
    it('should update the lead when it exists', async () => {
      repo.findById.mockResolvedValue(mockLead());
      repo.update.mockResolvedValue(
        mockLead({ name: 'Ana', isTermsAccepted: true })
      );

      const result = await service.update('lead-1', {
        name: 'Ana',
        isTermsAccepted: true,
      });

      expect(result.name).toBe('Ana');
      expect(result.isTermsAccepted).toBe(true);
      expect(repo.update).toHaveBeenCalledWith('lead-1', {
        name: 'Ana',
        isTermsAccepted: true,
      });
    });

    it('should throw a 404 HttpError when the lead does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Ana' })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'lead:errors.notFound',
      });
    });
  });

  describe('associateWithUser', () => {
    it('should link the lead to the user when the lead exists', async () => {
      repo.findById.mockResolvedValue(mockLead());

      await service.associateWithUser('lead-1', 'user-1');

      expect(repo.linkUser).toHaveBeenCalledWith('lead-1', 'user-1');
    });

    it('should not throw when the lead does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.associateWithUser('nonexistent', 'user-1')
      ).resolves.toBeUndefined();
      expect(repo.linkUser).not.toHaveBeenCalled();
    });

    it('should not throw when linking fails', async () => {
      repo.findById.mockResolvedValue(mockLead());
      repo.linkUser.mockRejectedValue(new Error('db down'));

      await expect(
        service.associateWithUser('lead-1', 'user-1')
      ).resolves.toBeUndefined();
    });
  });
});
