import { Request, Response } from 'express';
import { HistoryCatalogService } from '../services/history/history-catalog.service';
import { listHistoriesQuerySchema } from '../types/http/history.validation';
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
      const histories = await this.historyCatalogService.listAvailable(
        parsedQuery.data.isFeatured
      );
      sendSuccess(res, histories);
    } catch {
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };
}
