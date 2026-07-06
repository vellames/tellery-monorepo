import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { RevenueCatWebhookService } from '../../services/subscription/revenuecat-webhook.service';
import { RevenueCatWebhookPayload } from '../../types/domain/subscription/revenuecat-webhook.types';
import { handleError, sendSuccess } from '../../utils/response.utils';
import { TranslationFunction } from '../../types/i18n.types';

export interface RevenueCatWebhookControllerConfig {
  webhookAuthorization: string | undefined;
}

export class RevenueCatWebhookController {
  constructor(
    private readonly webhookService: RevenueCatWebhookService,
    private readonly config: RevenueCatWebhookControllerConfig
  ) {}

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;

    if (
      !this.config.webhookAuthorization ||
      req.headers.authorization !== this.config.webhookAuthorization
    ) {
      handleError(
        res,
        new Error(t('subscription:errors.webhookInvalid')),
        StatusCodes.UNAUTHORIZED,
        t('subscription:errors.webhookInvalid')
      );
      return;
    }

    const payload = this.parseBody(req);
    if (!payload?.event?.app_user_id || !payload.event.type) {
      handleError(
        res,
        new Error(t('subscription:errors.webhookInvalid')),
        StatusCodes.BAD_REQUEST,
        t('subscription:errors.webhookInvalid')
      );
      return;
    }

    try {
      await this.webhookService.handleEvent(payload.event);
      sendSuccess(res, { received: true });
    } catch (error) {
      handleError(
        res,
        error,
        StatusCodes.INTERNAL_SERVER_ERROR,
        t('subscription:errors.webhookFailed')
      );
    }
  };

  private parseBody(req: Request): RevenueCatWebhookPayload | null {
    try {
      if (Buffer.isBuffer(req.body)) {
        return JSON.parse(
          req.body.toString('utf-8')
        ) as RevenueCatWebhookPayload;
      }
      if (req.body && typeof req.body === 'object') {
        return req.body as RevenueCatWebhookPayload;
      }
      return null;
    } catch {
      return null;
    }
  }
}
