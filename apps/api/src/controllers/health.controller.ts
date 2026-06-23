import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { TranslationFunction } from '../types/i18n.types';

export class HealthController {
  constructor(private readonly prisma: PrismaClient) {}

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
    res.json({ status: t('common:status.ok') });
  }

  async readiness(req: Request, res: Response): Promise<void> {
    const t = req.t as TranslationFunction;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.json({
        status: t('common:status.ok'),
        database: t('common:database.connected'),
      });
    } catch {
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        status: t('common:status.unhealthy'),
        database: t('common:database.disconnected'),
      });
    }
  }
}
