import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { UserRepository } from '../UserRepository';

type PrismaUser = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  name: string;
  email: string | null;
  password: string | null;
  accountType: 'permanent' | 'temporary';
  ssn: string | null;
  emailVerifiedAt: Date | null;
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
  accountType: 'permanent',
  ssn: null,
  emailVerifiedAt: null,
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

    it('should update ssn when provided', async () => {
      const updated = mockUser({ ssn: '29537995593' });
      prisma.user.update.mockResolvedValue(updated);

      const result = await repo.update('user-1', { ssn: '29537995593' });

      expect(result).toEqual(updated);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { ssn: '29537995593' },
      });
    });

    it('should clear ssn when null is provided', async () => {
      prisma.user.update.mockResolvedValue(mockUser({ ssn: null }));

      await repo.update('user-1', { ssn: null });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { ssn: null },
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

  describe('setAvailableCredits', () => {
    it('should reset availableCredits to the given amount', async () => {
      prisma.user.update.mockResolvedValue(mockUser({ availableCredits: 20 }));

      await repo.setAvailableCredits('user-1', 20);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { availableCredits: 20 },
      });
    });

    it('should forward the transaction when provided', async () => {
      const tx = { user: { update: jest.fn().mockResolvedValue(mockUser()) } };

      await repo.setAvailableCredits('user-1', 20, tx as never);

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { availableCredits: 20 },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('markEmailVerified', () => {
    it('should set emailVerifiedAt and return the updated user', async () => {
      const verified = mockUser({
        emailVerifiedAt: new Date('2026-07-01'),
      });
      prisma.user.update.mockResolvedValue(verified);

      const result = await repo.markEmailVerified('user-1');

      expect(result).toEqual(verified);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerifiedAt: expect.any(Date) },
      });
    });

    it('should forward the transaction when provided', async () => {
      const tx = {
        user: { update: jest.fn().mockResolvedValue(mockUser()) },
      };

      await repo.markEmailVerified('user-1', tx as never);

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerifiedAt: expect.any(Date) },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('createTemporary', () => {
    it('should create a temporary user with null email/password and accountType temporary', async () => {
      const created = mockUser({
        email: null,
        password: null,
        accountType: 'temporary',
        name: 'Jogador',
      });
      prisma.user.create.mockResolvedValue(created);

      const result = await repo.createTemporary({ name: 'Jogador' });

      expect(result).toEqual(created);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Jogador',
          email: null,
          password: null,
          accountType: 'temporary',
        },
      });
    });

    it('should forward the transaction when provided', async () => {
      const created = mockUser({ accountType: 'temporary' });
      const tx = {
        user: { create: jest.fn().mockResolvedValue(created) },
      };

      await repo.createTemporary({ name: 'Jogador' }, tx as never);

      expect(tx.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Jogador',
          email: null,
          password: null,
          accountType: 'temporary',
        },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('convertToPermanent', () => {
    it('should update the user to permanent with name, email and hashed password', async () => {
      const converted = mockUser({
        name: 'Ana',
        email: 'ana@teste.local',
        password: 'hashed-password',
        accountType: 'permanent',
      });
      prisma.user.update.mockResolvedValue(converted);

      const result = await repo.convertToPermanent('user-1', {
        name: 'Ana',
        email: 'ana@teste.local',
        password: 'hashed-password',
      });

      expect(result).toEqual(converted);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          name: 'Ana',
          email: 'ana@teste.local',
          password: 'hashed-password',
          accountType: 'permanent',
        },
      });
    });

    it('should forward the transaction when provided', async () => {
      const converted = mockUser({ accountType: 'permanent' });
      const tx = {
        user: { update: jest.fn().mockResolvedValue(converted) },
      };

      await repo.convertToPermanent(
        'user-1',
        {
          name: 'Ana',
          email: 'ana@teste.local',
          password: 'hashed-password',
        },
        tx as never
      );

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          name: 'Ana',
          email: 'ana@teste.local',
          password: 'hashed-password',
          accountType: 'permanent',
        },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('findTemporaryById', () => {
    it('should return the user when it is temporary and not deleted', async () => {
      const tempUser = mockUser({
        accountType: 'temporary',
        email: null,
        password: null,
      });
      prisma.user.findFirst.mockResolvedValue(tempUser);

      const result = await repo.findTemporaryById('user-1');

      expect(result).toEqual(tempUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', accountType: 'temporary', deletedAt: null },
      });
    });

    it('should return null when the user is permanent', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.findTemporaryById('user-1');

      expect(result).toBeNull();
    });

    it('should return null when the user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.findTemporaryById('nonexistent');

      expect(result).toBeNull();
    });

    it('should forward the transaction when provided', async () => {
      const tempUser = mockUser({ accountType: 'temporary' });
      const tx = {
        user: { findFirst: jest.fn().mockResolvedValue(tempUser) },
      };

      await repo.findTemporaryById('user-1', tx as never);

      expect(tx.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', accountType: 'temporary', deletedAt: null },
      });
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });
  });
});
