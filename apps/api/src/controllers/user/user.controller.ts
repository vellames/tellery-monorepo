import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../../services/user/user.service';
import {
  createUserSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
} from '../../types/domain/user/user.validation';
import { HttpError } from '../../utils/http-error';
import {
  handleError,
  sendSuccess,
  sendValidationError,
} from '../../utils/response.utils';
import { TranslationFunction } from '../../types/i18n.types';

export class UserController {
  constructor(private readonly userService: UserService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsed.error.issues
      );
      return;
    }

    try {
      const user = await this.userService.create(parsed.data);
      sendSuccess(res, user, undefined, StatusCodes.CREATED);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey ? t(error.messageKey) : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsed.error.issues
      );
      return;
    }

    try {
      const auth = await this.userService.login(parsed.data);
      sendSuccess(res, auth);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey ? t(error.messageKey) : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;

    try {
      const user = await this.userService.findById(req.user!.id);
      sendSuccess(res, user);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey ? t(error.messageKey) : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };

  getAvailableCredits = async (req: Request, res: Response): Promise<void> => {
    try {
      const credits = await this.userService.getAvailableCredits(req.user!.id);
      sendSuccess(res, credits);
    } catch (error) {
      if (error instanceof HttpError) {
        const t = req.t as TranslationFunction;
        const message = error.messageKey ? t(error.messageKey) : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      const t = req.t as TranslationFunction;
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsed.error.issues
      );
      return;
    }

    try {
      const user = await this.userService.update(req.user!.id, parsed.data);
      sendSuccess(res, user);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey ? t(error.messageKey) : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsed.error.issues
      );
      return;
    }

    try {
      await this.userService.changePassword(
        req.user!.id,
        parsed.data.currentPassword,
        parsed.data.newPassword
      );
      sendSuccess(res, null);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey ? t(error.messageKey) : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };
}
