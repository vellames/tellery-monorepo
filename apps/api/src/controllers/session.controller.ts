import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HistorySessionService } from '../services/session/history-session.service';
import { SessionInteractionService } from '../services/session/session-interaction.service';
import {
  interactBodySchema,
  startSessionBodySchema,
} from '../types/http/session.validation';
import { HttpError } from '../utils/http-error';
import { handleError, sendSuccess } from '../utils/response.utils';

export class SessionController {
  constructor(
    private readonly historySessionService: HistorySessionService,
    private readonly sessionInteractionService: SessionInteractionService
  ) {}

  start = async (req: Request, res: Response): Promise<void> => {
    const parsedBody = startSessionBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      handleError(
        res,
        new Error('Invalid request body'),
        StatusCodes.UNPROCESSABLE_ENTITY
      );
      return;
    }

    try {
      const response = await this.historySessionService.startSession(
        parsedBody.data
      );
      sendSuccess(res, response, undefined, StatusCodes.CREATED);
    } catch (error) {
      if (error instanceof HttpError) {
        handleError(res, error, error.statusCode);
        return;
      }
      handleError(res, error);
    }
  };

  interact = async (req: Request, res: Response): Promise<void> => {
    const parsedBody = interactBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      handleError(
        res,
        new Error('Invalid request body'),
        StatusCodes.UNPROCESSABLE_ENTITY
      );
      return;
    }

    try {
      const sessionId = String(req.params.sessionId);
      const response = await this.sessionInteractionService.interact(
        sessionId,
        parsedBody.data
      );
      sendSuccess(res, response);
    } catch (error) {
      if (error instanceof HttpError) {
        handleError(res, error, error.statusCode);
        return;
      }
      handleError(res, error);
    }
  };
}
