import Stripe from 'stripe';

export interface CreateCustomerInput {
  email: string;
  name: string;
  userId: string;
}

export interface CreateCheckoutSessionInput {
  customerId: string;
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateBillingPortalSessionInput {
  customerId: string;
  returnUrl: string;
}

export interface IStripeService {
  createCustomer(input: CreateCustomerInput): Promise<Stripe.Customer>;
  createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<Stripe.Checkout.Session>;
  createBillingPortalSession(
    input: CreateBillingPortalSessionInput
  ): Promise<Stripe.BillingPortal.Session>;
  retrieveSubscription(id: string): Promise<Stripe.Subscription>;
  retrievePrice(id: string): Promise<Stripe.Price>;
  constructWebhookEvent(
    rawBody: Buffer,
    signature: string | string[]
  ): Stripe.Event;
}
