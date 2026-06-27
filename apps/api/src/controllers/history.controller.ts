import { Request, Response } from 'express';
import { HistoryCatalogService } from '../services/history/history-catalog.service';
import { listHistoriesQuerySchema } from '../types/http/history.validation';
import { HttpError } from '../utils/http-error';
import {
  handleError,
  sendSuccess,
  sendValidationError,
} from '../utils/response.utils';
import { TranslationFunction } from '../types/i18n.types';

export class HistoryController {
  constructor(
    private readonly historyCatalogService: HistoryCatalogService
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsedQuery = listHistoriesQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestQuery'),
        parsedQuery.error.issues
      );
      return;
    }

    try {
      const { isFeatured, page, limit } = parsedQuery.data;
      const histories = await this.historyCatalogService.listAvailable(
        isFeatured,
        { page, limit }
      );
      sendSuccess(res, histories);
    } catch {
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;

    try {
      const history = await this.historyCatalogService.getById(
        String(req.params.historyId)
      );
      sendSuccess(res, history);
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
