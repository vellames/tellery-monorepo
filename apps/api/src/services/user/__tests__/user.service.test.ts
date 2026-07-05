import { User } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  IEmailVerificationService,
  ILeadRepository,
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
  accountType: 'permanent',
  ssn: null,
  emailVerifiedAt: null,
  availableCredits: 3,
  ...overrides,
});

describe('UserService', () => {
  let repo: DeepMockProxy<IUserRepository>;
  let leadRepo: DeepMockProxy<ILeadRepository>;
  let passwordHasher: DeepMockProxy<IPasswordHasher>;
  let tokenService: DeepMockProxy<ITokenService>;
  let emailVerification: DeepMockProxy<IEmailVerificationService>;
  let service: UserService;

  beforeEach(() => {
    repo = mockDeep<IUserRepository>();
    leadRepo = mockDeep<ILeadRepository>();
    passwordHasher = mockDeep<IPasswordHasher>();
    passwordHasher.hash.mockResolvedValue('hashed-password');
    tokenService = mockDeep<ITokenService>();
    tokenService.sign.mockReturnValue('signed-token');
    emailVerification = mockDeep<IEmailVerificationService>();
    emailVerification.verifyToken.mockReturnValue({
      sub: 'user-1',
      email: 'ana@teste.local',
    });
    emailVerification.sendVerification.mockResolvedValue(undefined);
    service = new UserService(
      repo,
      leadRepo,
      passwordHasher,
      tokenService,
      emailVerification
    );
  });

  afterEach(() => {
    mockReset(repo);
    mockReset(leadRepo);
    mockReset(passwordHasher);
    mockReset(tokenService);
    mockReset(emailVerification);
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
      expect(tokenService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'ana@teste.local',
      });
      expect(result).toEqual({
        user: {
          id: 'user-1',
          name: 'Ana Teste',
          email: 'ana@teste.local',
          accountType: 'permanent',
          ssn: null,
          emailVerifiedAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        token: 'signed-token',
      });
      expect(emailVerification.sendVerification).toHaveBeenCalledWith(
        { id: 'user-1', email: 'ana@teste.local', name: 'Ana Teste' },
        'pt-BR'
      );
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

    it('should link the lead to the new user when leadId is provided', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockUser());

      await service.create(
        {
          name: 'Ana Teste',
          email: 'ana@teste.local',
          password: 'password123',
        },
        'pt-BR',
        'lead-1'
      );

      expect(leadRepo.linkUser).toHaveBeenCalledWith('lead-1', 'user-1');
    });

    it('should not link a lead when leadId is omitted', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockUser());

      await service.create({
        name: 'Ana Teste',
        email: 'ana@teste.local',
        password: 'password123',
      });

      expect(leadRepo.linkUser).not.toHaveBeenCalled();
    });

    it('should still succeed when lead linking fails', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockUser());
      leadRepo.linkUser.mockRejectedValue(new Error('db down'));

      const result = await service.create(
        {
          name: 'Ana Teste',
          email: 'ana@teste.local',
          password: 'password123',
        },
        'pt-BR',
        'lead-1'
      );

      expect(leadRepo.linkUser).toHaveBeenCalledWith('lead-1', 'user-1');
      expect(result.token).toBe('signed-token');
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
      expect(result.user).not.toHaveProperty('password');
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
          accountType: 'permanent',
          ssn: null,
          emailVerifiedAt: null,
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

  describe('getAvailableCredits', () => {
    it('should return the credit balance for an existing user', async () => {
      repo.findById.mockResolvedValue(mockUser({ availableCredits: 23 }));

      const result = await service.getAvailableCredits('user-1');

      expect(result).toEqual({ availableCredits: 23 });
    });

    it('should throw 404 when user is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getAvailableCredits('nonexistent')).rejects.toThrow(
        HttpError
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

    it('should normalize a valid CPF before updating ssn', async () => {
      repo.findById.mockResolvedValue(mockUser());
      repo.update.mockResolvedValue(mockUser({ ssn: '29537995593' }));

      const result = await service.update('user-1', {
        ssn: '295.379.955-93',
      });

      expect(repo.update).toHaveBeenCalledWith('user-1', {
        ssn: '29537995593',
      });
      expect(result.ssn).toBe('29537995593');
    });

    it('should clear ssn when an empty value is provided', async () => {
      repo.findById.mockResolvedValue(mockUser({ ssn: '29537995593' }));
      repo.update.mockResolvedValue(mockUser({ ssn: null }));

      await service.update('user-1', { ssn: '' });

      expect(repo.update).toHaveBeenCalledWith('user-1', { ssn: null });
    });

    it('should throw 422 when ssn is not a valid CPF', async () => {
      repo.findById.mockResolvedValue(mockUser());

      await expect(
        service.update('user-1', { ssn: '111.111.111-11' })
      ).rejects.toMatchObject({ statusCode: 422 });

      expect(repo.update).not.toHaveBeenCalled();
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

  describe('verifyEmail', () => {
    it('should mark the user as verified when the token is valid', async () => {
      repo.findById.mockResolvedValue(mockUser());
      repo.markEmailVerified.mockResolvedValue(
        mockUser({ emailVerifiedAt: new Date('2026-07-01') })
      );

      const result = await service.verifyEmail('valid-token');

      expect(emailVerification.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(repo.markEmailVerified).toHaveBeenCalledWith('user-1');
      expect(result.emailVerifiedAt).toBe('2026-07-01T00:00:00.000Z');
    });

    it('should throw 422 when the verification token is invalid', async () => {
      emailVerification.verifyToken.mockImplementation(() => {
        throw new HttpError(422, 'Invalid or expired verification token');
      });

      await expect(service.verifyEmail('bad')).rejects.toThrow(HttpError);
      expect(repo.markEmailVerified).not.toHaveBeenCalled();
    });

    it('should throw 404 when the user no longer exists', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.verifyEmail('valid-token')).rejects.toThrow(
        'User not found'
      );
      expect(repo.markEmailVerified).not.toHaveBeenCalled();
    });

    it('should throw 409 when the email is already verified', async () => {
      repo.findById.mockResolvedValue(
        mockUser({ emailVerifiedAt: new Date('2026-07-01') })
      );

      await expect(service.verifyEmail('valid-token')).rejects.toThrow(
        'Email is already verified'
      );
      expect(repo.markEmailVerified).not.toHaveBeenCalled();
    });
  });

  describe('resendEmailVerification', () => {
    it('should resend the verification email to an unverified user', async () => {
      repo.findById.mockResolvedValue(mockUser());

      await service.resendEmailVerification('user-1', 'en');

      expect(emailVerification.sendVerification).toHaveBeenCalledWith(
        { id: 'user-1', email: 'ana@teste.local', name: 'Ana Teste' },
        'en'
      );
    });

    it('should throw 404 when the user is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.resendEmailVerification('user-1')).rejects.toThrow(
        'User not found'
      );
      expect(emailVerification.sendVerification).not.toHaveBeenCalled();
    });

    it('should throw 409 when the email is already verified', async () => {
      repo.findById.mockResolvedValue(
        mockUser({ emailVerifiedAt: new Date('2026-07-01') })
      );

      await expect(service.resendEmailVerification('user-1')).rejects.toThrow(
        'Email is already verified'
      );
      expect(emailVerification.sendVerification).not.toHaveBeenCalled();
    });
  });

  describe('createTemporary', () => {
    it('should create a temporary user and sign a jwt with empty email', async () => {
      const tempUser = mockUser({
        email: null,
        password: null,
        accountType: 'temporary',
        name: 'Jogador',
      });
      repo.createTemporary.mockResolvedValue(tempUser);

      const result = await service.createTemporary('Jogador');

      expect(repo.createTemporary).toHaveBeenCalledWith({ name: 'Jogador' });
      expect(tokenService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: '',
      });
      expect(result).toEqual({
        user: {
          id: 'user-1',
          name: 'Jogador',
          email: null,
          accountType: 'temporary',
          ssn: null,
          emailVerifiedAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        token: 'signed-token',
      });
    });

    it('should not send email verification (temporary user has no email)', async () => {
      repo.createTemporary.mockResolvedValue(
        mockUser({ accountType: 'temporary', email: null })
      );

      await service.createTemporary('Jogador');

      expect(emailVerification.sendVerification).not.toHaveBeenCalled();
    });

    it('should link the lead to the temp user when leadId is provided', async () => {
      repo.createTemporary.mockResolvedValue(
        mockUser({ accountType: 'temporary' })
      );

      await service.createTemporary('Jogador', 'lead-1');

      expect(leadRepo.linkUser).toHaveBeenCalledWith('lead-1', 'user-1');
    });

    it('should not link a lead when leadId is omitted', async () => {
      repo.createTemporary.mockResolvedValue(
        mockUser({ accountType: 'temporary' })
      );

      await service.createTemporary('Jogador');

      expect(leadRepo.linkUser).not.toHaveBeenCalled();
    });

    it('should still succeed when lead linking fails', async () => {
      repo.createTemporary.mockResolvedValue(
        mockUser({ accountType: 'temporary' })
      );
      leadRepo.linkUser.mockRejectedValue(new Error('db down'));

      const result = await service.createTemporary('Jogador', 'lead-1');

      expect(leadRepo.linkUser).toHaveBeenCalledWith('lead-1', 'user-1');
      expect(result.token).toBe('signed-token');
    });

    it('should not expose password in the response', async () => {
      repo.createTemporary.mockResolvedValue(
        mockUser({ accountType: 'temporary' })
      );

      const result = await service.createTemporary('Jogador');

      expect(result).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('convertTemporary', () => {
    const dto = {
      name: 'Ana Convertida',
      email: 'ana@teste.local',
      password: 'new-password',
    };

    it('should convert a temporary user to permanent and reissue the jwt with the real email', async () => {
      const tempUser = mockUser({
        accountType: 'temporary',
        email: null,
        password: null,
      });
      const convertedUser = mockUser({
        name: 'Ana Convertida',
        email: 'ana@teste.local',
        password: 'hashed-password',
        accountType: 'permanent',
      });
      repo.findTemporaryById.mockResolvedValue(tempUser);
      repo.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashed-password');
      repo.convertToPermanent.mockResolvedValue(convertedUser);

      const result = await service.convertTemporary('user-1', dto);

      expect(repo.findTemporaryById).toHaveBeenCalledWith('user-1');
      expect(repo.findByEmail).toHaveBeenCalledWith('ana@teste.local');
      expect(passwordHasher.hash).toHaveBeenCalledWith('new-password');
      expect(repo.convertToPermanent).toHaveBeenCalledWith('user-1', {
        name: 'Ana Convertida',
        email: 'ana@teste.local',
        password: 'hashed-password',
      });
      expect(tokenService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'ana@teste.local',
      });
      expect(result).toEqual({
        user: {
          id: 'user-1',
          name: 'Ana Convertida',
          email: 'ana@teste.local',
          accountType: 'permanent',
          ssn: null,
          emailVerifiedAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        token: 'signed-token',
      });
    });

    it('should throw 422 when the user is not temporary', async () => {
      repo.findTemporaryById.mockResolvedValue(null);

      await expect(
        service.convertTemporary('user-1', dto)
      ).rejects.toMatchObject({ statusCode: 422 });

      expect(repo.findByEmail).not.toHaveBeenCalled();
      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(repo.convertToPermanent).not.toHaveBeenCalled();
    });

    it('should throw 409 when the email is already in use by another user', async () => {
      repo.findTemporaryById.mockResolvedValue(
        mockUser({ accountType: 'temporary' })
      );
      repo.findByEmail.mockResolvedValue(
        mockUser({ id: 'user-2', email: 'ana@teste.local' })
      );

      await expect(service.convertTemporary('user-1', dto)).rejects.toThrow(
        'Email already in use'
      );

      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(repo.convertToPermanent).not.toHaveBeenCalled();
    });

    it('should send email verification after conversion (fire-and-forget)', async () => {
      const convertedUser = mockUser({
        name: 'Ana Convertida',
        email: 'ana@teste.local',
        accountType: 'permanent',
      });
      repo.findTemporaryById.mockResolvedValue(
        mockUser({ accountType: 'temporary' })
      );
      repo.findByEmail.mockResolvedValue(null);
      repo.convertToPermanent.mockResolvedValue(convertedUser);

      await service.convertTemporary('user-1', dto);

      expect(emailVerification.sendVerification).toHaveBeenCalledWith(
        { id: 'user-1', email: 'ana@teste.local', name: 'Ana Convertida' },
        'pt-BR'
      );
    });

    it('should still succeed when email verification sending fails', async () => {
      const convertedUser = mockUser({
        name: 'Ana Convertida',
        email: 'ana@teste.local',
        accountType: 'permanent',
      });
      repo.findTemporaryById.mockResolvedValue(
        mockUser({ accountType: 'temporary' })
      );
      repo.findByEmail.mockResolvedValue(null);
      repo.convertToPermanent.mockResolvedValue(convertedUser);
      emailVerification.sendVerification.mockRejectedValue(
        new Error('email service down')
      );

      const result = await service.convertTemporary('user-1', dto);

      expect(result.token).toBe('signed-token');
    });

    it('should not expose password in the response', async () => {
      const convertedUser = mockUser({
        accountType: 'permanent',
        password: 'hashed-password',
      });
      repo.findTemporaryById.mockResolvedValue(
        mockUser({ accountType: 'temporary' })
      );
      repo.findByEmail.mockResolvedValue(null);
      repo.convertToPermanent.mockResolvedValue(convertedUser);

      const result = await service.convertTemporary('user-1', dto);

      expect(result).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('password');
    });
  });
});
