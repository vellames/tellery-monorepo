import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { UserController } from '../user.controller';
import { UserService } from '../../../services/user/user.service';
import { HttpError } from '../../../utils/http-error';
import { TranslationFunction } from '../../../types/i18n.types';

describe('UserController', () => {
  let userService: DeepMockProxy<UserService>;
  let controller: UserController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    userService = mockDeep<UserService>();
    controller = new UserController(userService);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(userService);
  });

  describe('register', () => {
    it('should return 201 with the created user and a token', async () => {
      const userDto = {
        id: 'user-1',
        name: 'Ana Teste',
        email: 'ana@teste.local',
        ssn: null,
        emailVerifiedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const authPayload = { user: userDto, token: 'signed-token' };
      userService.create.mockResolvedValue(authPayload);
      req = {
        body: {
          name: 'Ana Teste',
          email: 'ana@teste.local',
          password: 'password123',
        },
        t,
      };

      await controller.register(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: authPayload,
        message: undefined,
      });
    });

    it('should return 422 when body is invalid', async () => {
      req = { body: { name: '', email: 'not-an-email', password: '' }, t };

      await controller.register(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should return 409 when email is already in use', async () => {
      userService.create.mockRejectedValue(
        new HttpError(
          StatusCodes.CONFLICT,
          'Email already in use',
          'user:errors.emailAlreadyInUse'
        )
      );
      req = {
        body: {
          name: 'Ana Teste',
          email: 'ana@teste.local',
          password: 'password123',
        },
        t,
      };

      await controller.register(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'user:errors.emailAlreadyInUse',
        })
      );
    });

    it('should return 500 on unexpected errors', async () => {
      userService.create.mockRejectedValue(new Error('Something went wrong'));
      req = {
        body: {
          name: 'Ana Teste',
          email: 'ana@teste.local',
          password: 'password123',
        },
        t,
      };

      await controller.register(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('login', () => {
    it('should return 200 with the auth payload', async () => {
      const authPayload = {
        user: {
          id: 'user-1',
          name: 'Ana Teste',
          email: 'ana@teste.local',
          ssn: null,
          emailVerifiedAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        token: 'signed-token',
      };
      userService.login.mockResolvedValue(authPayload);
      req = {
        body: { email: 'ana@teste.local', password: 'password123' },
        t,
      };

      await controller.login(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: authPayload,
        message: undefined,
      });
    });

    it('should return 422 when body is invalid', async () => {
      req = { body: { email: 'not-an-email', password: '' }, t };

      await controller.login(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should return 401 when credentials are invalid', async () => {
      userService.login.mockRejectedValue(
        new HttpError(
          StatusCodes.UNAUTHORIZED,
          'Invalid email or password',
          'user:errors.invalidCredentials'
        )
      );
      req = {
        body: { email: 'ana@teste.local', password: 'wrong-password' },
        t,
      };

      await controller.login(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'user:errors.invalidCredentials',
        })
      );
    });

    it('should return 500 on unexpected errors', async () => {
      userService.login.mockRejectedValue(new Error('Something went wrong'));
      req = {
        body: { email: 'ana@teste.local', password: 'password123' },
        t,
      };

      await controller.login(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('getProfile', () => {
    it('should return 200 with the logged-in user profile', async () => {
      const userDto = {
        id: 'user-1',
        name: 'Ana Teste',
        email: 'ana@teste.local',
        ssn: null,
        emailVerifiedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      userService.findById.mockResolvedValue(userDto);
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        t,
      } as Partial<Request>;

      await controller.getProfile(req as Request, res as Response);

      expect(userService.findById).toHaveBeenCalledWith('user-1');
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: userDto,
        message: undefined,
      });
    });

    it('should return 404 when user is not found', async () => {
      userService.findById.mockRejectedValue(
        new HttpError(
          StatusCodes.NOT_FOUND,
          'User not found',
          'user:errors.userNotFound'
        )
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        t,
      } as Partial<Request>;

      await controller.getProfile(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'user:errors.userNotFound',
        })
      );
    });

    it('should return 500 on unexpected errors', async () => {
      userService.findById.mockRejectedValue(new Error('Something went wrong'));
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        t,
      } as Partial<Request>;

      await controller.getProfile(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('getAvailableCredits', () => {
    it('should return 200 with the credit balance', async () => {
      userService.getAvailableCredits.mockResolvedValue({
        availableCredits: 23,
      });
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        t,
      } as Partial<Request>;

      await controller.getAvailableCredits(req as Request, res as Response);

      expect(userService.getAvailableCredits).toHaveBeenCalledWith('user-1');
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: { availableCredits: 23 },
        message: undefined,
      });
    });

    it('should return 404 when user is not found', async () => {
      userService.getAvailableCredits.mockRejectedValue(
        new HttpError(
          StatusCodes.NOT_FOUND,
          'User not found',
          'user:errors.userNotFound'
        )
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        t,
      } as Partial<Request>;

      await controller.getAvailableCredits(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    });

    it('should return 500 on unexpected errors', async () => {
      userService.getAvailableCredits.mockRejectedValue(
        new Error('Something went wrong')
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        t,
      } as Partial<Request>;

      await controller.getAvailableCredits(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('updateProfile', () => {
    it('should return 200 with the updated user', async () => {
      const userDto = {
        id: 'user-1',
        name: 'Ana Updated',
        email: 'ana.updated@teste.local',
        ssn: null,
        emailVerifiedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      };
      userService.update.mockResolvedValue(userDto);
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: {
          name: 'Ana Updated',
          email: 'ana.updated@teste.local',
          ssn: '295.379.955-93',
        },
        t,
      } as Partial<Request>;

      await controller.updateProfile(req as Request, res as Response);

      expect(userService.update).toHaveBeenCalledWith('user-1', {
        name: 'Ana Updated',
        email: 'ana.updated@teste.local',
        ssn: '295.379.955-93',
      });
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: userDto,
        message: undefined,
      });
    });

    it('should return 422 when body is invalid', async () => {
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { email: 'not-an-email' },
        t,
      } as Partial<Request>;

      await controller.updateProfile(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should return 422 when a password field is sent', async () => {
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { name: 'Ana', password: 'secret' },
        t,
      } as Partial<Request>;

      await controller.updateProfile(req as Request, res as Response);

      expect(userService.update).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return 409 when email is already in use', async () => {
      userService.update.mockRejectedValue(
        new HttpError(
          StatusCodes.CONFLICT,
          'Email already in use',
          'user:errors.emailAlreadyInUse'
        )
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { email: 'taken@teste.local' },
        t,
      } as Partial<Request>;

      await controller.updateProfile(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'user:errors.emailAlreadyInUse',
        })
      );
    });

    it('should return 404 when user is not found', async () => {
      userService.update.mockRejectedValue(
        new HttpError(
          StatusCodes.NOT_FOUND,
          'User not found',
          'user:errors.userNotFound'
        )
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { name: 'Ana' },
        t,
      } as Partial<Request>;

      await controller.updateProfile(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    });

    it('should return 500 on unexpected errors', async () => {
      userService.update.mockRejectedValue(new Error('Something went wrong'));
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { name: 'Ana' },
        t,
      } as Partial<Request>;

      await controller.updateProfile(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('changePassword', () => {
    it('should return 200 when the password is changed', async () => {
      userService.changePassword.mockResolvedValue(undefined);
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { currentPassword: 'password123', newPassword: 'new-password' },
        t,
      } as Partial<Request>;

      await controller.changePassword(req as Request, res as Response);

      expect(userService.changePassword).toHaveBeenCalledWith(
        'user-1',
        'password123',
        'new-password'
      );
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 422 when required fields are missing', async () => {
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { currentPassword: 'password123' },
        t,
      } as Partial<Request>;

      await controller.changePassword(req as Request, res as Response);

      expect(userService.changePassword).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return 422 when newPassword is shorter than 6 chars', async () => {
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { currentPassword: 'password123', newPassword: '12345' },
        t,
      } as Partial<Request>;

      await controller.changePassword(req as Request, res as Response);

      expect(userService.changePassword).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return 422 when newPassword equals currentPassword', async () => {
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: {
          currentPassword: 'same-password',
          newPassword: 'same-password',
        },
        t,
      } as Partial<Request>;

      await controller.changePassword(req as Request, res as Response);

      expect(userService.changePassword).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return 401 when the current password is wrong', async () => {
      userService.changePassword.mockRejectedValue(
        new HttpError(
          StatusCodes.UNAUTHORIZED,
          'Current password is incorrect',
          'user:errors.currentPasswordIncorrect'
        )
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: {
          currentPassword: 'wrong-password',
          newPassword: 'new-password',
        },
        t,
      } as Partial<Request>;

      await controller.changePassword(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'user:errors.currentPasswordIncorrect',
        })
      );
    });

    it('should return 404 when user is not found', async () => {
      userService.changePassword.mockRejectedValue(
        new HttpError(
          StatusCodes.NOT_FOUND,
          'User not found',
          'user:errors.userNotFound'
        )
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { currentPassword: 'password123', newPassword: 'new-password' },
        t,
      } as Partial<Request>;

      await controller.changePassword(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    });

    it('should return 500 on unexpected errors', async () => {
      userService.changePassword.mockRejectedValue(
        new Error('Something went wrong')
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        body: { currentPassword: 'password123', newPassword: 'new-password' },
        t,
      } as Partial<Request>;

      await controller.changePassword(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('verifyEmail', () => {
    const verifiedDto = {
      id: 'user-1',
      name: 'Ana Teste',
      email: 'ana@teste.local',
      ssn: null,
      emailVerifiedAt: '2026-07-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('should return 200 with the verified user', async () => {
      userService.verifyEmail.mockResolvedValue(verifiedDto);
      req = { body: { token: 'valid-token' }, t } as Partial<Request>;

      await controller.verifyEmail(req as Request, res as Response);

      expect(userService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: verifiedDto,
        message: undefined,
      });
    });

    it('should return 422 when token is missing', async () => {
      req = { body: {}, t } as Partial<Request>;

      await controller.verifyEmail(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(userService.verifyEmail).not.toHaveBeenCalled();
    });

    it('should return 422 when the token is invalid', async () => {
      userService.verifyEmail.mockRejectedValue(
        new HttpError(
          StatusCodes.UNPROCESSABLE_ENTITY,
          'Invalid or expired verification token',
          'user:errors.invalidVerificationToken'
        )
      );
      req = { body: { token: 'bad' }, t } as Partial<Request>;

      await controller.verifyEmail(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return 409 when already verified', async () => {
      userService.verifyEmail.mockRejectedValue(
        new HttpError(
          StatusCodes.CONFLICT,
          'Email is already verified',
          'user:errors.emailAlreadyVerified'
        )
      );
      req = { body: { token: 'valid-token' }, t } as Partial<Request>;

      await controller.verifyEmail(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
    });
  });

  describe('resendVerification', () => {
    it('should return 200 when the email is resent', async () => {
      userService.resendEmailVerification.mockResolvedValue(undefined);
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        language: 'pt-BR',
        t,
      } as Partial<Request>;

      await controller.resendVerification(req as Request, res as Response);

      expect(userService.resendEmailVerification).toHaveBeenCalledWith(
        'user-1',
        'pt-BR'
      );
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should return 409 when the email is already verified', async () => {
      userService.resendEmailVerification.mockRejectedValue(
        new HttpError(
          StatusCodes.CONFLICT,
          'Email is already verified',
          'user:errors.emailAlreadyVerified'
        )
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        language: 'pt-BR',
        t,
      } as Partial<Request>;

      await controller.resendVerification(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
    });

    it('should return 500 on unexpected errors', async () => {
      userService.resendEmailVerification.mockRejectedValue(
        new Error('Something went wrong')
      );
      req = {
        user: { id: 'user-1', email: 'ana@teste.local' },
        language: 'pt-BR',
        t,
      } as Partial<Request>;

      await controller.resendVerification(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
