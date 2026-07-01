import Stripe from 'stripe';
import { StripeService } from '../stripe.service';

type StripeClientConfig = NonNullable<ConstructorParameters<typeof Stripe>[1]>;

const sessionsCreate = jest.fn();
const customersCreate = jest.fn();
const portalSessionsCreate = jest.fn();
const subscriptionsRetrieve = jest.fn();
const pricesRetrieve = jest.fn();
const constructEvent = jest.fn();

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: sessionsCreate } },
    customers: { create: customersCreate },
    billingPortal: { sessions: { create: portalSessionsCreate } },
    subscriptions: { retrieve: subscriptionsRetrieve },
    prices: { retrieve: pricesRetrieve },
    webhooks: { constructEvent },
  }))
);

describe('StripeService', () => {
  const config = {
    secretKey: 'sk_test_123',
    webhookSecret: 'whsec_123',
    apiVersion: '2026-06-24.dahlia' as StripeClientConfig['apiVersion'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create the Stripe client with the configured API version', () => {
    new StripeService(config);

    expect(Stripe).toHaveBeenCalledWith(config.secretKey, {
      apiVersion: config.apiVersion,
    });
  });

  it('should create checkout sessions with billing details collection', async () => {
    sessionsCreate.mockResolvedValue({ id: 'cs_123' });
    const service = new StripeService(config);

    await service.createCheckoutSession({
      customerId: 'cus_123',
      userId: 'user-1',
      priceId: 'price_123',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        billing_address_collection: 'required',
        customer_update: { address: 'auto', name: 'auto' },
      })
    );
  });
});
