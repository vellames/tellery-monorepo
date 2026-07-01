import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SubscriptionController } from '../subscription.controller';
import { SubscriptionService } from '../../../services/subscription/subscription.service';
import { HttpError } from '../../../utils/http-error';
import { TranslationFunction } from '../../../types/i18n.types';

describe('SubscriptionController', () => {
  let subscriptionService: DeepMockProxy<SubscriptionService>;
  let controller: SubscriptionController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    subscriptionService = mockDeep<SubscriptionService>();
    controller = new SubscriptionController(subscriptionService);
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(subscriptionService);
  });

  describe('getPlan', () => {
    it('should return 200 with the plan', async () => {
      const plan = { name: 'Mensal', amountInCents: 1990 };
      subscriptionService.getPlanDisplay.mockResolvedValue(plan as never);
      req = { t };

      await controller.getPlan(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: plan,
        message: undefined,
      });
    });

    it('should return 200 with null when no plan', async () => {
      subscriptionService.getPlanDisplay.mockResolvedValue(null);
      req = { t };

      await controller.getPlan(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ data: null })
      );
    });
  });

  describe('getSubscription', () => {
    it('should return 200 with the subscription', async () => {
      subscriptionService.getSubscription.mockResolvedValue({
        id: 'sub-1',
      } as never);
      req = { user: { id: 'user-1', email: 'a@b.c' }, t } as Partial<Request>;

      await controller.getSubscription(req as Request, res as Response);

      expect(subscriptionService.getSubscription).toHaveBeenCalledWith(
        'user-1'
      );
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('createCheckoutSession', () => {
    it('should return 200 with the checkout url', async () => {
      subscriptionService.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/s_1',
      });
      req = {
        user: { id: 'user-1', email: 'a@b.c' },
        body: {},
        t,
      } as Partial<Request>;

      await controller.createCheckoutSession(req as Request, res as Response);

      expect(subscriptionService.createCheckoutSession).toHaveBeenCalledWith(
        'user-1',
        undefined
      );
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should return 422 when body contains an invalid field', async () => {
      req = {
        user: { id: 'user-1', email: 'a@b.c' },
        body: { unexpected: true },
        t,
      } as Partial<Request>;

      await controller.createCheckoutSession(req as Request, res as Response);

      expect(subscriptionService.createCheckoutSession).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should forward HttpError status codes', async () => {
      subscriptionService.createCheckoutSession.mockRejectedValue(
        new HttpError(
          StatusCodes.NOT_FOUND,
          'User not found',
          'user:errors.userNotFound'
        )
      );
      req = {
        user: { id: 'user-1', email: 'a@b.c' },
        body: {},
        t,
      } as Partial<Request>;

      await controller.createCheckoutSession(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    });
  });

  describe('createBillingPortalSession', () => {
    it('should return 200 with the portal url', async () => {
      subscriptionService.createBillingPortalSession.mockResolvedValue({
        url: 'https://billing.stripe.com/p_1',
      });
      req = {
        user: { id: 'user-1', email: 'a@b.c' },
        t,
      } as Partial<Request>;

      await controller.createBillingPortalSession(
        req as Request,
        res as Response
      );

      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('handleWebhook', () => {
    it('should return 400 when signature header is missing', async () => {
      req = { headers: {}, body: Buffer.from('{}'), t } as Partial<Request>;

      await controller.handleWebhook(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(subscriptionService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should return 200 when the event is processed', async () => {
      subscriptionService.handleWebhook.mockResolvedValue(undefined);
      req = {
        headers: { 'stripe-signature': 't=1,v1=abc' },
        body: Buffer.from('{}'),
        t,
      } as Partial<Request>;

      await controller.handleWebhook(req as Request, res as Response);

      expect(subscriptionService.handleWebhook).toHaveBeenCalledWith(
        Buffer.from('{}'),
        't=1,v1=abc'
      );
      expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should return 400 when the service throws a stripe error', async () => {
      subscriptionService.handleWebhook.mockRejectedValue(
        Object.assign(new Error('bad sig'), { type: 'StripeSignatureError' })
      );
      req = {
        headers: { 'stripe-signature': 'bad' },
        body: Buffer.from('{}'),
        t,
      } as Partial<Request>;

      await controller.handleWebhook(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    it('should return 500 on unexpected errors', async () => {
      subscriptionService.handleWebhook.mockRejectedValue(new Error('boom'));
      req = {
        headers: { 'stripe-signature': 'sig' },
        body: Buffer.from('{}'),
        t,
      } as Partial<Request>;

      await controller.handleWebhook(req as Request, res as Response);

      expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
