import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../../services/user/user.service';
import { createUserSchema } from '../../types/domain/user/user.validation';
import { HttpError } from '../../utils/http-error';
import { handleError, sendSuccess } from '../../utils/response.utils';
import { TranslationFunction } from '../../types/i18n.types';

export class UserController {
  constructor(private readonly userService: UserService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      handleError(
        res,
        new Error(t('common:errors.invalidRequestBody')),
        StatusCodes.UNPROCESSABLE_ENTITY
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
}
