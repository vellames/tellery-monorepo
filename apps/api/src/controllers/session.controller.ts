import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HistorySessionService } from '../services/session/history-session.service';
import { SessionInteractionService } from '../services/session/session-interaction.service';
import { SessionConclusionService } from '../services/session/session-conclusion.service';
import {
  IAudioStorage,
  IAudioTranscriptionService,
} from '../interfaces';
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
    private readonly sessionConclusionService: SessionConclusionService,
    private readonly audioStorage: IAudioStorage,
    private readonly audioTranscription: IAudioTranscriptionService
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
        res.status(error.statusCode).json({
          success: false,
          error: message,
          ...error.details,
        });
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

  abandonSession = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;

    try {
      const sessionId = String(req.params.sessionId);
      await this.historySessionService.abandonSession(
        sessionId,
        req.user!.id
      );
      sendSuccess(res, { sessionId });
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

  listSessions = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;

    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 10;
      const status = req.query.status
        ? String(req.query.status)
        : undefined;

      const response = await this.historySessionService.listSessions(
        req.user!.id,
        page,
        limit,
        status
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
    const sessionId = String(req.params.sessionId);

    try {
      let stateId: string;
      let interaction: string;

      // Audio path: multipart with file + stateId field
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (file) {
        stateId = String(req.body.stateId ?? '');

        if (!stateId) {
          sendValidationError(
            res,
            t('common:errors.invalidRequestBody'),
            [{ message: 'stateId is required' }]
          );
          return;
        }

        const extension = file.originalname.split('.').pop() ?? 'webm';
        const { key } = await this.audioStorage.upload({
          sessionId,
          buffer: file.buffer,
          contentType: file.mimetype,
          extension,
        });

        const { text } = await this.audioTranscription.transcribe({
          buffer: file.buffer,
          contentType: file.mimetype,
          filename: file.originalname,
        });

        if (!text.trim()) {
          sendValidationError(res, t('session:interact.audioEmpty'), [
            { message: 'Audio transcription returned empty text' },
          ]);
          return;
        }

        console.log('[interact] audio transcribed', {
          sessionId,
          audioKey: key,
          text: text.slice(0, 80),
        });

        interaction = text;
      } else {
        // Text path: JSON body
        const parsedBody = interactBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
          sendValidationError(
            res,
            t('common:errors.invalidRequestBody'),
            parsedBody.error.issues
          );
          return;
        }
        stateId = parsedBody.data.stateId;
        interaction = parsedBody.data.interaction;
      }

      const response = await this.sessionInteractionService.interact(
        sessionId,
        req.user!.id,
        { stateId, interaction },
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
