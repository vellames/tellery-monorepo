import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SubscriptionService } from '../../services/subscription/subscription.service';
import { createCheckoutSchema } from '../../types/domain/subscription/subscription.validation';
import { HttpError } from '../../utils/http-error';
import {
  handleError,
  sendSuccess,
  sendValidationError,
} from '../../utils/response.utils';
import { TranslationFunction } from '../../types/i18n.types';

const STRIPE_SIGNATURE_HEADER = 'stripe-signature';

const isStripeError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'type' in error &&
  typeof (error as { type: unknown }).type === 'string' &&
  ((error as { type: string }).type as string).startsWith('Stripe');

export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  getPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const plan = await this.subscriptionService.getPlanDisplay();
      sendSuccess(res, plan);
    } catch (error) {
      this.handleControllerError(req, res, error);
    }
  };

  getSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const syncFromStripe = req.query.sync === '1';
      const subscription = await this.subscriptionService.getSubscription(
        req.user!.id,
        syncFromStripe
      );
      sendSuccess(res, subscription);
    } catch (error) {
      this.handleControllerError(req, res, error);
    }
  };

  createCheckoutSession = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const t = req.t as TranslationFunction;
    const parsed = createCheckoutSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(
        res,
        t('common:errors.invalidRequestBody'),
        parsed.error.issues
      );
      return;
    }

    try {
      const checkout = await this.subscriptionService.createCheckoutSession(
        req.user!.id,
        parsed.data.priceId
      );
      sendSuccess(res, checkout);
    } catch (error) {
      this.handleControllerError(req, res, error);
    }
  };

  createBillingPortalSession = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const portal = await this.subscriptionService.createBillingPortalSession(
        req.user!.id
      );
      sendSuccess(res, portal);
    } catch (error) {
      this.handleControllerError(req, res, error);
    }
  };

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const t = req.t as TranslationFunction;
    const signature = req.headers[STRIPE_SIGNATURE_HEADER];
    const rawBody = Buffer.isBuffer(req.body)
      ? (req.body as Buffer)
      : Buffer.from('');

    if (!signature || rawBody.length === 0) {
      handleError(
        res,
        new Error(t('subscription:errors.webhookInvalid')),
        StatusCodes.BAD_REQUEST
      );
      return;
    }

    try {
      await this.subscriptionService.handleWebhook(rawBody, signature);
      sendSuccess(res, { received: true });
    } catch (error) {
      if (isStripeError(error)) {
        handleError(
          res,
          new Error(t('subscription:errors.webhookInvalid')),
          StatusCodes.BAD_REQUEST
        );
        return;
      }
      handleError(
        res,
        new Error(t('subscription:errors.webhookFailed')),
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  };

  private handleControllerError = (
    req: Request,
    res: Response,
    error: unknown
  ): void => {
    const t = req.t as TranslationFunction;
    if (error instanceof HttpError) {
      const message = error.messageKey ? t(error.messageKey) : error.message;
      handleError(res, error, error.statusCode, message);
      return;
    }
    handleError(
      res,
      error,
      StatusCodes.INTERNAL_SERVER_ERROR,
      t('common:errors.internalError')
    );
  };
}
