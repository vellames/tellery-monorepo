import 'dotenv/config';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const GRANTABLE_REASONS = new Set([
  'subscription_create',
  'subscription_cycle',
]);

async function run(): Promise<void> {
  const locals = await prisma.subscription.findMany({
    where: { deletedAt: null },
  });

  if (locals.length === 0) {
    console.log('No local subscriptions to sync.');
    return;
  }

  for (const local of locals) {
    const list = await stripe.subscriptions.list({
      customer: local.stripeCustomerId,
      status: 'all',
      limit: 10,
    });
    const current =
      list.data.find((s) => s.status === 'active') ?? list.data[0];

    if (!current) {
      console.log(
        `No Stripe subscription for customer ${local.stripeCustomerId}`
      );
      continue;
    }

    const priceId = current.items.data[0]?.price?.id ?? null;
    const item = current.items.data[0];
    const plan = priceId
      ? await prisma.plan.findFirst({ where: { stripePriceId: priceId } })
      : null;

    await prisma.subscription.update({
      where: { id: local.id },
      data: {
        stripeSubscriptionId: current.id,
        stripePriceId: priceId,
        planId: plan?.id ?? null,
        status: current.status as SubscriptionStatus,
        currentPeriodStart: item
          ? new Date(item.current_period_start * 1000)
          : null,
        currentPeriodEnd: item
          ? new Date(item.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: current.cancel_at_period_end,
      },
    });
    console.log(
      `Synced ${local.stripeCustomerId} -> sub ${current.id} (${current.status}, price ${priceId})`
    );

    const invoices = await stripe.invoices.list({
      subscription: current.id,
      limit: 20,
    });

    for (const inv of invoices.data) {
      if (inv.status !== 'paid') continue;
      const reason = inv.billing_reason;
      if (!reason || !GRANTABLE_REASONS.has(reason)) continue;

      const already = await prisma.creditGrant.findUnique({
        where: { stripeInvoiceId: inv.id },
      });
      if (already) {
        console.log(`  invoice ${inv.id} already granted, skipping`);
        continue;
      }

      const credits = plan?.creditsPerCycle ?? 0;
      if (!credits) continue;

      await prisma.$transaction(async (tx) => {
        await tx.creditGrant.create({
          data: {
            subscriptionId: local.id,
            userId: local.userId,
            stripeInvoiceId: inv.id,
            credits,
          },
        });
        await tx.user.update({
          where: { id: local.userId },
          data: { availableCredits: credits },
        });
      });
      console.log(
        `  granted ${credits} credits for invoice ${inv.id} (${reason})`
      );
    }

    const user = await prisma.user.findUnique({ where: { id: local.userId } });
    console.log(
      `  user ${local.userId} availableCredits = ${user?.availableCredits}`
    );
  }
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
