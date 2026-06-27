import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HistorySessionService } from '../services/session/history-session.service';
import { SessionInteractionService } from '../services/session/session-interaction.service';
import { SessionConclusionService } from '../services/session/session-conclusion.service';
import {
  conclusionBodySchema,
  interactBodySchema,
  startSessionBodySchema,
} from '../types/http/session.validation';
import { HttpError } from '../utils/http-error';
import {
  handleError,
  sendSuccess,
  sendValidationError,
} from '../utils/response.utils';
import { TranslationFunction } from '../types/i18n.types';

export class SessionController {
  constructor(
    private readonly historySessionService: HistorySessionService,
    private readonly sessionInteractionService: SessionInteractionService,
    private readonly sessionConclusionService: SessionConclusionService
  ) {}

  start = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsedBody = startSessionBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsedBody.error.issues
      );
      return;
    }

    try {
      const response = await this.historySessionService.startSession(
        req.user!.id,
        parsedBody.data
      );
      sendSuccess(res, response, undefined, StatusCodes.CREATED);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey
          ? t(error.messageKey, { id: error.message })
          : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };

  getSession = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;

    try {
      const sessionId = String(req.params.sessionId);
      const response = await this.historySessionService.getSessionState(
        sessionId,
        req.user!.id
      );
      sendSuccess(res, response);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey
          ? t(error.messageKey, { id: error.message })
          : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };

  interact = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsedBody = interactBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsedBody.error.issues
      );
      return;
    }

    try {
      const sessionId = String(req.params.sessionId);
      const response = await this.sessionInteractionService.interact(
        sessionId,
        req.user!.id,
        parsedBody.data,
        req.language
      );
      sendSuccess(res, response);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey
          ? t(error.messageKey, { id: error.message })
          : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };

  submitConclusion = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsedBody = conclusionBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsedBody.error.issues
      );
      return;
    }

    try {
      const sessionId = String(req.params.sessionId);
      const response = await this.sessionConclusionService.submit(
        sessionId,
        req.user!.id,
        parsedBody.data
      );
      sendSuccess(res, response);
    } catch (error) {
      if (error instanceof HttpError) {
        const message = error.messageKey
          ? t(error.messageKey, { id: error.message })
          : error.message;
        handleError(res, new Error(message), error.statusCode);
        return;
      }
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };
}
