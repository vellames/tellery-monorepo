import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { UserRepository } from '../UserRepository';

type PrismaUser = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  name: string;
  email: string;
  password: string;
  availableCredits: number;
};

const mockUser = (overrides: Partial<PrismaUser> = {}): PrismaUser => ({
  id: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  name: 'Ana Teste',
  email: 'ana@teste.local',
  password: 'password123',
  availableCredits: 3,
  ...overrides,
});

describe('UserRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repo: UserRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new UserRepository(prisma);
  });

  afterEach(() => {
    mockReset(prisma);
  });

  describe('create', () => {
    it('should create a user with the provided data', async () => {
      const input = {
        name: 'Ana Teste',
        email: 'ana@teste.local',
        password: 'password123',
      };
      const created = mockUser(input);
      prisma.user.create.mockResolvedValue(created);

      const result = await repo.create(input);

      expect(result).toEqual(created);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
      });
    });
  });

  describe('findById', () => {
    it('should find a non-deleted user by id', async () => {
      const user = mockUser();
      prisma.user.findFirst.mockResolvedValue(user);

      const result = await repo.findById('user-1');

      expect(result).toEqual(user);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', deletedAt: null },
      });
    });

    it('should return null when user is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a non-deleted user by email', async () => {
      const user = mockUser();
      prisma.user.findFirst.mockResolvedValue(user);

      const result = await repo.findByEmail('ana@teste.local');

      expect(result).toEqual(user);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'ana@teste.local', deletedAt: null },
      });
    });

    it('should return null when email is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.findByEmail('nobody@teste.local');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted users ordered by createdAt desc', async () => {
      const users = [mockUser({ id: 'user-1' }), mockUser({ id: 'user-2' })];
      prisma.user.findMany.mockResolvedValue(users);

      const result = await repo.findAll();

      expect(result).toEqual(users);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no users exist', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await repo.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update only provided fields', async () => {
      const updated = mockUser({ name: 'Updated Name' });
      prisma.user.update.mockResolvedValue(updated);

      const result = await repo.update('user-1', { name: 'Updated Name' });

      expect(result).toEqual(updated);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
      });
    });

    it('should update multiple fields', async () => {
      const updated = mockUser({
        name: 'New Name',
        email: 'new@teste.local',
      });
      prisma.user.update.mockResolvedValue(updated);

      const result = await repo.update('user-1', {
        name: 'New Name',
        email: 'new@teste.local',
      });

      expect(result).toEqual(updated);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name', email: 'new@teste.local' },
      });
    });

    it('should not include undefined fields in update data', async () => {
      const updated = mockUser();
      prisma.user.update.mockResolvedValue(updated);

      await repo.update('user-1', { name: 'New Name' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' },
      });
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt instead of removing the record', async () => {
      prisma.user.update.mockResolvedValue(mockUser());

      await repo.softDelete('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('decrementAvailableCredits', () => {
    it('should conditionally decrement and return true when a row was updated', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 1 });

      const result = await repo.decrementAvailableCredits('user-1');

      expect(result).toBe(true);
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
          availableCredits: { gt: 0 },
          deletedAt: null,
        },
        data: { availableCredits: { decrement: 1 } },
      });
    });

    it('should return false when no row was updated (quota exhausted)', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 0 });

      const result = await repo.decrementAvailableCredits('user-1');

      expect(result).toBe(false);
    });

    it('should forward the transaction when provided', async () => {
      const tx = {
        user: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      };
      prisma.user.updateMany.mockResolvedValue({ count: 1 });

      await repo.decrementAvailableCredits('user-1', tx as never);

      expect(tx.user.updateMany).toHaveBeenCalled();
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('addCredits', () => {
    it('should increment availableCredits by the given amount', async () => {
      prisma.user.update.mockResolvedValue(mockUser({ availableCredits: 23 }));

      await repo.addCredits('user-1', 20);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { availableCredits: { increment: 20 } },
      });
    });

    it('should forward the transaction when provided', async () => {
      const tx = { user: { update: jest.fn().mockResolvedValue(mockUser()) } };

      await repo.addCredits('user-1', 20, tx as never);

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { availableCredits: { increment: 20 } },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
