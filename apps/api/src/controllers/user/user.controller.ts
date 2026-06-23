import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../../services/user/user.service';
import { createUserSchema } from '../../types/domain/user/user.validation';
import { HttpError } from '../../utils/http-error';
import { handleError, sendSuccess } from '../../utils/response.utils';

export class UserController {
  constructor(private readonly userService: UserService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      handleError(
        res,
        new Error('Invalid request body'),
        StatusCodes.BAD_REQUEST
      );
      return;
    }

    try {
      const user = await this.userService.create(parsed.data);
      sendSuccess(res, user, undefined, StatusCodes.CREATED);
    } catch (error) {
      if (error instanceof HttpError) {
        handleError(res, error, error.statusCode);
        return;
      }
      handleError(res, error);
    }
  };
}
