import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { RevenueCatWebhookController } from '../revenuecat-webhook.controller';
import { RevenueCatWebhookService } from '../../../services/subscription/revenuecat-webhook.service';
import { TranslationFunction } from '../../../types/i18n.types';

const WEBHOOK_SECRET = 'whsec-test-secret';

describe('RevenueCatWebhookController', () => {
  let webhookService: DeepMockProxy<RevenueCatWebhookService>;
  let controller: RevenueCatWebhookController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let t: TranslationFunction;

  beforeEach(() => {
    webhookService = mockDeep<RevenueCatWebhookService>();
    controller = new RevenueCatWebhookController(webhookService, {
      webhookAuthorization: WEBHOOK_SECRET,
    });
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status };
    t = jest.fn((key: string) => key) as unknown as TranslationFunction;
  });

  afterEach(() => {
    mockReset(webhookService);
  });

  const validEvent = {
    id: 'evt_1',
    type: 'INITIAL_PURCHASE',
    app_user_id: 'user-1',
    product_id: 'monthly',
  };

  it('should return 401 when the Authorization header is missing', async () => {
    req = {
      headers: {},
      body: Buffer.from(JSON.stringify({ event: validEvent })),
      t,
    } as Partial<Request>;

    await controller.handleWebhook(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(webhookService.handleEvent).not.toHaveBeenCalled();
  });

  it('should return 401 when the Authorization header does not match', async () => {
    req = {
      headers: { authorization: 'wrong-secret' },
      body: Buffer.from(JSON.stringify({ event: validEvent })),
      t,
    } as Partial<Request>;

    await controller.handleWebhook(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(webhookService.handleEvent).not.toHaveBeenCalled();
  });

  it('should return 401 when no webhook secret is configured', async () => {
    controller = new RevenueCatWebhookController(webhookService, {
      webhookAuthorization: undefined,
    });
    req = {
      headers: { authorization: WEBHOOK_SECRET },
      body: Buffer.from(JSON.stringify({ event: validEvent })),
      t,
    } as Partial<Request>;

    await controller.handleWebhook(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  it('should return 400 when the payload is malformed', async () => {
    req = {
      headers: { authorization: WEBHOOK_SECRET },
      body: Buffer.from('not-json'),
      t,
    } as Partial<Request>;

    await controller.handleWebhook(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(webhookService.handleEvent).not.toHaveBeenCalled();
  });

  it('should return 400 when the event is missing required fields', async () => {
    req = {
      headers: { authorization: WEBHOOK_SECRET },
      body: Buffer.from(JSON.stringify({ event: { id: 'evt_1' } })),
      t,
    } as Partial<Request>;

    await controller.handleWebhook(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(webhookService.handleEvent).not.toHaveBeenCalled();
  });

  it('should process a valid raw-buffer payload and return 200', async () => {
    webhookService.handleEvent.mockResolvedValue(undefined);
    req = {
      headers: { authorization: WEBHOOK_SECRET },
      body: Buffer.from(
        JSON.stringify({ api_version: '1.0', event: validEvent })
      ),
      t,
    } as Partial<Request>;

    await controller.handleWebhook(req as Request, res as Response);

    expect(webhookService.handleEvent).toHaveBeenCalledWith(validEvent);
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { received: true } })
    );
  });

  it('should process an already-parsed object body and return 200', async () => {
    webhookService.handleEvent.mockResolvedValue(undefined);
    req = {
      headers: { authorization: WEBHOOK_SECRET },
      body: { api_version: '1.0', event: validEvent },
      t,
    } as Partial<Request>;

    await controller.handleWebhook(req as Request, res as Response);

    expect(webhookService.handleEvent).toHaveBeenCalledWith(validEvent);
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it('should return 500 when the service throws', async () => {
    webhookService.handleEvent.mockRejectedValue(new Error('boom'));
    req = {
      headers: { authorization: WEBHOOK_SECRET },
      body: Buffer.from(JSON.stringify({ event: validEvent })),
      t,
    } as Partial<Request>;

    await controller.handleWebhook(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
