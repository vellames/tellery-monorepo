import { Request, Response } from 'express';
import { HistoryCatalogService } from '../services/history/history-catalog.service';
import { handleError, sendSuccess } from '../utils/response.utils';
import { TranslationFunction } from '../types/i18n.types';

export class HistoryController {
  constructor(
    private readonly historyCatalogService: HistoryCatalogService
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;

    try {
      const histories = await this.historyCatalogService.listAvailable();
      sendSuccess(res, histories);
    } catch {
      handleError(res, new Error(t('common:errors.internalError')));
    }
  };
}
