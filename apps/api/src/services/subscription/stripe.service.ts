import Stripe from 'stripe';
import {
  CreateBillingPortalSessionInput,
  CreateCheckoutSessionInput,
  CreateCustomerInput,
  IStripeService,
} from '../../interfaces';

export interface StripeServiceConfig {
  secretKey: string;
  webhookSecret: string | undefined;
}

export class StripeService implements IStripeService {
  private readonly client: Stripe;

  constructor(private readonly config: StripeServiceConfig) {
    this.client = new Stripe(config.secretKey);
  }

  async createCustomer(input: CreateCustomerInput): Promise<Stripe.Customer> {
    return this.client.customers.create({
      email: input.email,
      name: input.name,
      metadata: { userId: input.userId },
    });
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<Stripe.Checkout.Session> {
    return this.client.checkout.sessions.create({
      customer: input.customerId,
      mode: 'subscription',
      line_items: [{ price: input.priceId, quantity: 1 }],
      client_reference_id: input.userId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      tax_id_collection: { enabled: true },
      billing_address_collection: 'auto',
      customer_update: { address: 'auto', name: 'auto' },
      metadata: { userId: input.userId },
    });
  }

  async createBillingPortalSession(
    input: CreateBillingPortalSessionInput
  ): Promise<Stripe.BillingPortal.Session> {
    return this.client.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });
  }

  async retrieveSubscription(id: string): Promise<Stripe.Subscription> {
    return this.client.subscriptions.retrieve(id);
  }

  async retrievePrice(id: string): Promise<Stripe.Price> {
    return this.client.prices.retrieve(id, { expand: ['product'] });
  }

  constructWebhookEvent(
    rawBody: Buffer,
    signature: string | string[]
  ): Stripe.Event {
    if (!this.config.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return this.client.webhooks.constructEvent(
      rawBody,
      signature,
      this.config.webhookSecret
    );
  }
}
