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
    it('should return 201 with the created user', async () => {
      const userDto = {
        id: 'user-1',
        name: 'Ana Teste',
        email: 'ana@teste.local',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      userService.create.mockResolvedValue(userDto);
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
        data: userDto,
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
});
