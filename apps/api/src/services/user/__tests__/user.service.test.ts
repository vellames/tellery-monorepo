import { User } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { IUserRepository } from '../../../interfaces';
import { UserService } from '../user.service';
import { HttpError } from '../../../utils/http-error';

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  name: 'Ana Teste',
  email: 'ana@teste.local',
  password: 'password123',
  ...overrides,
});

describe('UserService', () => {
  let repo: DeepMockProxy<IUserRepository>;
  let service: UserService;

  beforeEach(() => {
    repo = mockDeep<IUserRepository>();
    service = new UserService(repo);
  });

  afterEach(() => {
    mockReset(repo);
  });

  describe('create', () => {
    it('should create a user when email is not taken', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockUser());

      const result = await service.create({
        name: 'Ana Teste',
        email: 'ana@teste.local',
        password: 'password123',
      });

      expect(result).toEqual({
        id: 'user-1',
        name: 'Ana Teste',
        email: 'ana@teste.local',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('should throw 409 when email is already in use', async () => {
      repo.findByEmail.mockResolvedValue(mockUser());

      await expect(
        service.create({
          name: 'Ana Teste',
          email: 'ana@teste.local',
          password: 'password123',
        })
      ).rejects.toThrow(HttpError);

      await expect(
        service.create({
          name: 'Ana Teste',
          email: 'ana@teste.local',
          password: 'password123',
        })
      ).rejects.toThrow('Email already in use');
    });

    it('should not expose password in the response', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockUser());

      const result = await service.create({
        name: 'Ana Teste',
        email: 'ana@teste.local',
        password: 'password123',
      });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findById', () => {
    it('should return a user dto when found', async () => {
      repo.findById.mockResolvedValue(mockUser());

      const result = await service.findById('user-1');

      expect(result.id).toBe('user-1');
      expect(result.name).toBe('Ana Teste');
    });

    it('should throw 404 when user is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(HttpError);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('findAll', () => {
    it('should return all users as dtos', async () => {
      repo.findAll.mockResolvedValue([
        mockUser({ id: 'user-1' }),
        mockUser({ id: 'user-2', name: 'Bruno' }),
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
      expect(result[1].id).toBe('user-2');
    });

    it('should return empty array when no users', async () => {
      repo.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update and return the updated user', async () => {
      repo.findById.mockResolvedValue(mockUser());
      repo.update.mockResolvedValue(mockUser({ name: 'Updated' }));

      const result = await service.update('user-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw 404 when user is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Updated' })
      ).rejects.toThrow('User not found');
    });

    it('should throw 409 when updating to an email already in use by another user', async () => {
      repo.findById.mockResolvedValue(mockUser({ email: 'old@teste.local' }));
      repo.findByEmail.mockResolvedValue(
        mockUser({ id: 'user-2', email: 'new@teste.local' })
      );

      await expect(
        service.update('user-1', { email: 'new@teste.local' })
      ).rejects.toThrow('Email already in use');
    });

    it('should not check email conflict when keeping the same email', async () => {
      repo.findById.mockResolvedValue(mockUser({ email: 'same@teste.local' }));
      repo.update.mockResolvedValue(mockUser({ name: 'New Name' }));

      const result = await service.update('user-1', {
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
      expect(repo.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete an existing user', async () => {
      repo.findById.mockResolvedValue(mockUser());

      await service.delete('user-1');

      expect(repo.softDelete).toHaveBeenCalledWith('user-1');
    });

    it('should throw 404 when user is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        'User not found'
      );
      expect(repo.softDelete).not.toHaveBeenCalled();
    });
  });
});
