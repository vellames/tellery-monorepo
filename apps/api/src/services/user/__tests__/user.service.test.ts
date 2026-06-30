import { User } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
} from '../../../interfaces';
import { UserService } from '../user.service';
import { HttpError } from '../../../utils/http-error';

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  name: 'Ana Teste',
  email: 'ana@teste.local',
  password: 'hashed-password',
  availableSessions: 3,
  ...overrides,
});

describe('UserService', () => {
  let repo: DeepMockProxy<IUserRepository>;
  let passwordHasher: DeepMockProxy<IPasswordHasher>;
  let tokenService: DeepMockProxy<ITokenService>;
  let service: UserService;

  beforeEach(() => {
    repo = mockDeep<IUserRepository>();
    passwordHasher = mockDeep<IPasswordHasher>();
    passwordHasher.hash.mockResolvedValue('hashed-password');
    tokenService = mockDeep<ITokenService>();
    tokenService.sign.mockReturnValue('signed-token');
    service = new UserService(repo, passwordHasher, tokenService);
  });

  afterEach(() => {
    mockReset(repo);
    mockReset(passwordHasher);
    mockReset(tokenService);
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

      expect(passwordHasher.hash).toHaveBeenCalledWith('password123');
      expect(repo.create).toHaveBeenCalledWith({
        name: 'Ana Teste',
        email: 'ana@teste.local',
        password: 'hashed-password',
      });
      expect(result).toEqual({
        id: 'user-1',
        name: 'Ana Teste',
        email: 'ana@teste.local',
        availableSessions: 3,
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

    it('should not hash the password when email is already in use', async () => {
      repo.findByEmail.mockResolvedValue(mockUser());

      await expect(
        service.create({
          name: 'Ana Teste',
          email: 'ana@teste.local',
          password: 'password123',
        })
      ).rejects.toThrow(HttpError);

      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(repo.create).not.toHaveBeenCalled();
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

  describe('login', () => {
    it('should return user and token when credentials are valid', async () => {
      repo.findByEmail.mockResolvedValue(mockUser());
      passwordHasher.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'ana@teste.local',
        password: 'password123',
      });

      expect(passwordHasher.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      );
      expect(tokenService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'ana@teste.local',
      });
      expect(result).toEqual({
        user: {
          id: 'user-1',
          name: 'Ana Teste',
          email: 'ana@teste.local',
          availableSessions: 3,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        token: 'signed-token',
      });
    });

    it('should throw 401 when user is not found', async () => {
      repo.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'ana@teste.local',
          password: 'password123',
        })
      ).rejects.toThrow(HttpError);

      await expect(
        service.login({
          email: 'ana@teste.local',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw 401 when password does not match', async () => {
      repo.findByEmail.mockResolvedValue(mockUser());
      passwordHasher.compare.mockResolvedValue(false);

      await expect(
        service.login({
          email: 'ana@teste.local',
          password: 'wrong-password',
        })
      ).rejects.toThrow(HttpError);

      expect(tokenService.sign).not.toHaveBeenCalled();
    });

    it('should not expose password in the response', async () => {
      repo.findByEmail.mockResolvedValue(mockUser());
      passwordHasher.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'ana@teste.local',
        password: 'password123',
      });

      expect(result.user).not.toHaveProperty('password');
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

    it('should hash the new password before updating', async () => {
      repo.findById.mockResolvedValue(mockUser());
      repo.update.mockResolvedValue(mockUser());

      await service.update('user-1', { password: 'new-password' });

      expect(passwordHasher.hash).toHaveBeenCalledWith('new-password');
      expect(repo.update).toHaveBeenCalledWith('user-1', {
        password: 'hashed-password',
      });
    });

    it('should not hash the password when it is not being updated', async () => {
      repo.findById.mockResolvedValue(mockUser());
      repo.update.mockResolvedValue(mockUser({ name: 'New Name' }));

      await service.update('user-1', { name: 'New Name' });

      expect(passwordHasher.hash).not.toHaveBeenCalled();
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

  describe('changePassword', () => {
    it('should verify the current password before updating', async () => {
      repo.findById.mockResolvedValue(mockUser());
      passwordHasher.compare.mockResolvedValue(true);
      repo.update.mockResolvedValue(mockUser());

      await service.changePassword('user-1', 'password123', 'new-password');

      expect(passwordHasher.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      );
    });

    it('should hash the new password and persist it', async () => {
      repo.findById.mockResolvedValue(mockUser());
      passwordHasher.compare.mockResolvedValue(true);
      repo.update.mockResolvedValue(mockUser());

      await service.changePassword('user-1', 'password123', 'new-password');

      expect(passwordHasher.hash).toHaveBeenCalledWith('new-password');
      expect(repo.update).toHaveBeenCalledWith('user-1', {
        password: 'hashed-password',
      });
    });

    it('should throw 401 when the current password is wrong', async () => {
      repo.findById.mockResolvedValue(mockUser());
      passwordHasher.compare.mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', 'wrong-password', 'new-password')
      ).rejects.toThrow('Current password is incorrect');

      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('should throw 404 when the user is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.changePassword('user-1', 'password123', 'new-password')
      ).rejects.toThrow('User not found');

      expect(passwordHasher.compare).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
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
