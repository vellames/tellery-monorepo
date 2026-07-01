# Stripe Subscription — Sandbox Setup Guide

Target: **Brazil (BRL)**, monthly recurring, **20 credits/cycle**, hosted Checkout (redirect), Customer Portal enabled. Stripe is the **source of truth** for price; our DB owns the `creditsPerCycle` business rule. **No SSN/CPF is stored on our side** — Stripe Checkout collects the tax id (CPF) and billing address.

> Replace `<price>`, `<prod>` and `<whsec>` with the ids returned by each step. All `curl` examples assume `export STRIPE_SECRET_KEY=sk_test_...` in your shell. The pinned Stripe API version is `2026-06-24.dahlia` (matches the `stripe@22` SDK).

## 0. Prerequisites

1. **Stripe CLI** (local webhook forwarding + event triggers):
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login   # authenticate against the sandbox account in the browser
   ```
2. **API version** — Dashboard → Developers → API version. Keep it on `2026-06-24.dahlia` (or newer) to match the SDK.

## 1. Create the Product

```bash
stripe products create \
  --name="Assinatura Mensal" \
  --description="Acesso mensal — 20 créditos por ciclo"
```

Equivalent curl:

```bash
curl https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d name="Assinatura Mensal" \
  -d description="Acesso mensal — 20 créditos por ciclo"
```

Save the returned **`prod_...`** for step 2. (`POST /v1/products`)

## 2. Create the Price (BRL / monthly)

Replace `prod_XXXXXXXX`. `unit_amount` is in **centavos** (1990 = R$ 19,90) — adjust to your chosen price.

```bash
stripe prices create \
  --currency=brl \
  --unit-amount=1990 \
  -d recurring[interval]=month \
  -d recurring[usage_type]=licensed \
  -d product=prod_XXXXXXXX \
  -d nickname="Mensal Padrão"
```

```bash
curl https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d currency=brl \
  -d unit_amount=1990 \
  -d "recurring[interval]=month" \
  -d "recurring[usage_type]=licensed" \
  -d product=prod_XXXXXXXX \
  -d nickname="Mensal Padrão"
```

Save the returned **`price_...`**. This is your `STRIPE_MONTHLY_PRICE_ID`. The amount/currency is **fetched live** by the app via `stripe.prices.retrieve` — never hardcoded in our DB.

## 3. Enable the Customer Portal

Dashboard only (no API call):

1. Dashboard → **Settings → Billing → Customer portal** → enable.
2. Under **Features** enable: Cancel subscription, Update payment method, View invoices, Update billing address. (Add "Switch plans" later for tiers.)
3. Save. Portal sessions are created per-customer server-side via `POST /v1/billing_portal/sessions`.

## 4. Configure the Webhook Endpoint

### 4a. Local development (Stripe CLI tunnel)

Run in a separate terminal — it prints the `whsec_...` to put in `.env` as `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:3232/subscriptions/webhook
```

Keep it running while developing.

### 4b. Public endpoint (prod / sandbox)

```bash
curl https://api.stripe.com/v1/webhook_endpoints \
  -u "$STRIPE_SECRET_KEY:" \
  -d "url=https://<api-host>/subscriptions/webhook" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=customer.subscription.created" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted" \
  -d "enabled_events[]=invoice.paid" \
  -d "enabled_events[]=invoice.payment_failed"
```

Save the returned **`whsec_...`** as `STRIPE_WEBHOOK_SECRET` for that environment.

### Events we handle and why

| Event                                                                         | Why we listen                                                                                      |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `checkout.session.completed`                                                  | First subscription confirmation — persist `Subscription` row, link user via `client_reference_id`. |
| `customer.subscription.created`                                               | Redundant safety; idempotent upsert.                                                               |
| `customer.subscription.updated`                                               | Sync `status`, period dates, `cancel_at_period_end`, price changes.                                |
| `customer.subscription.deleted`                                               | Mark subscription canceled.                                                                        |
| `invoice.paid` (`billing_reason ∈ {subscription_create, subscription_cycle}`) | **Grant 20 credits** — fires on first purchase and each monthly renewal.                           |
| `invoice.payment_failed`                                                      | Awareness; status syncs via `subscription.updated`.                                                |

## 5. Populate environment variables

Root `.env` (gitignored — never commit real values):

```bash
STRIPE_SECRET_KEY=sk_test_...           # rotate if leaked
STRIPE_PUBLISHABLE_KEY=pk_test_...      # unused by MVP (hosted checkout), stored for future Stripe.js
STRIPE_WEBHOOK_SECRET=whsec_...         # from step 4a (`stripe listen`) for local
STRIPE_MONTHLY_PRICE_ID=price_...       # from step 2
WEB_BASE_URL=http://localhost:3000      # Next.js dev port; builds checkout success/cancel URLs
```

Mirror the keys (without real values) into `.env.example`.

## 6. Seed the Plan row

After running the migration, the seed is idempotent and reads the price id from env so it always matches what's in Stripe:

```bash
npm run db:migrate -w @ai-history/api -- --name add_subscriptions
npm run db:generate -w @ai-history/api
npm run db:seed -w @ai-history/api
```

## 7. Verify end-to-end

1. Start the API (`npm run docker:dev` or `npm run dev`) + `stripe listen` (4a) + Web dev server.
2. Log in, open `/subscription`, click **Assinar**.
3. Complete Checkout with a Brazil test card: `4242 4242 4242 4242`, any future expiry, any CVC, any CEP. Add a CPF in the tax-id field.
4. Watch the `stripe listen` terminal — you should see `checkout.session.completed` then `invoice.paid` (`billing_reason: subscription_create`).
5. Confirm in the DB: a `Subscription` row with `status = 'active'` and `User.availableCredits` increased by 20.
6. **Trigger events directly** (no checkout needed) to exercise each handler:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger invoice.paid
   stripe trigger customer.subscription.updated
   stripe trigger customer.subscription.deleted
   stripe trigger invoice.payment_failed
   ```
7. **Customer Portal**: with an active subscription, click "Gerenciar assinatura" → portal opens → cancel → `customer.subscription.deleted` webhook → local `status` flips to `canceled`.

## 8. Object graph

```
User (our DB)
 └─ Subscription (our DB, status mirror)
      └─ Plan (our DB, business rule: creditsPerCycle = 20)
           ↕ stripePriceId link
Stripe Customer  ──┐
                   ├─ Subscription (Stripe) ──recurring──▶ Invoice ──▶ payment
Checkout Session ──┘                         (cycle)        (invoice.paid → grant 20 credits)
```
