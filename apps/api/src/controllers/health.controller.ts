import { Request, Response } from 'express';
import { TranslationFunction } from '../types/i18n.types';

export class HealthController {
  index(req: Request, res: Response): void {
    const t = req.t as TranslationFunction;
    res.json({
      message: t('common:api.name'),
      endpoints: {
        'GET /health': t('common:api.healthCheck'),
        'POST /session/start': t('common:api.startSession'),
        'POST /session/:sessionId/interact': t('common:api.interactSession'),
      },
    });
  }

  health(req: Request, res: Response): void {
    const t = req.t as TranslationFunction;
    res.json({ status: t('common:status') });
  }
}
