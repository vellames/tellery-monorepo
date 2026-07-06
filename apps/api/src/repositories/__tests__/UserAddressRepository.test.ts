import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { UserAddressRepository } from '../UserAddressRepository';

type PrismaUserAddress = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  userId: string;
  zipCode: string;
  street: string;
  state: string;
  city: string;
  neighborhood: string;
  number: string | null;
  complement: string | null;
};

const mockAddress = (
  overrides: Partial<PrismaUserAddress> = {}
): PrismaUserAddress => ({
  id: 'address-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  userId: 'user-1',
  zipCode: '01310100',
  street: 'Avenida Paulista',
  state: 'SP',
  city: 'São Paulo',
  neighborhood: 'Bela Vista',
  number: '1000',
  complement: 'Apto 1',
  ...overrides,
});

describe('UserAddressRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repo: UserAddressRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new UserAddressRepository(prisma);
  });

  afterEach(() => {
    mockReset(prisma);
  });

  describe('findByUserId', () => {
    it('should find the address for a given user id', async () => {
      const address = mockAddress();
      prisma.userAddress.findFirst.mockResolvedValue(address);

      const result = await repo.findByUserId('user-1');

      expect(result).toEqual(address);
      expect(prisma.userAddress.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
      });
    });

    it('should return null when the user has no address', async () => {
      prisma.userAddress.findFirst.mockResolvedValue(null);

      const result = await repo.findByUserId('user-1');

      expect(result).toBeNull();
    });

    it('should forward the transaction when provided', async () => {
      const address = mockAddress();
      const tx = {
        userAddress: { findFirst: jest.fn().mockResolvedValue(address) },
      };

      await repo.findByUserId('user-1', tx as never);

      expect(tx.userAddress.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
      });
      expect(prisma.userAddress.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('upsertByUserId', () => {
    const input = {
      zipCode: '01310100',
      street: 'Avenida Paulista',
      state: 'SP',
      city: 'São Paulo',
      neighborhood: 'Bela Vista',
      number: '1000',
      complement: 'Apto 1',
    };

    it('should create the address when none exists yet', async () => {
      const created = mockAddress(input);
      prisma.userAddress.upsert.mockResolvedValue(created);

      const result = await repo.upsertByUserId('user-1', input);

      expect(result).toEqual(created);
      expect(prisma.userAddress.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1', ...input },
        update: { ...input },
      });
    });

    it('should update the existing address', async () => {
      const updated = mockAddress({ ...input, street: 'Rua Nova' });
      prisma.userAddress.upsert.mockResolvedValue(updated);

      const result = await repo.upsertByUserId('user-1', {
        ...input,
        street: 'Rua Nova',
      });

      expect(result.street).toBe('Rua Nova');
      expect(prisma.userAddress.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1', ...input, street: 'Rua Nova' },
        update: { ...input, street: 'Rua Nova' },
      });
    });

    it('should treat missing optional fields as null', async () => {
      const { number: _number, complement: _complement, ...required } = input;
      const created = mockAddress({
        ...required,
        number: null,
        complement: null,
      });
      prisma.userAddress.upsert.mockResolvedValue(created);

      await repo.upsertByUserId('user-1', required);

      expect(prisma.userAddress.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: {
          userId: 'user-1',
          ...required,
          number: null,
          complement: null,
        },
        update: { ...required, number: null, complement: null },
      });
    });

    it('should forward the transaction when provided', async () => {
      const created = mockAddress(input);
      const tx = {
        userAddress: { upsert: jest.fn().mockResolvedValue(created) },
      };

      await repo.upsertByUserId('user-1', input, tx as never);

      expect(tx.userAddress.upsert).toHaveBeenCalled();
      expect(prisma.userAddress.upsert).not.toHaveBeenCalled();
    });
  });
});
