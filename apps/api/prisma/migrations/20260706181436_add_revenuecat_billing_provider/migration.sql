-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('stripe', 'revenuecat');

-- AlterTable
ALTER TABLE "CreditGrant" ADD COLUMN     "revenueCatEventId" TEXT,
ALTER COLUMN "stripeInvoiceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "revenueCatProductId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "provider" "BillingProvider" NOT NULL DEFAULT 'stripe',
ADD COLUMN     "revenueCatOriginalTransactionId" TEXT,
ALTER COLUMN "stripeCustomerId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CreditGrant_revenueCatEventId_key" ON "CreditGrant"("revenueCatEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_revenueCatProductId_key" ON "Plan"("revenueCatProductId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_revenueCatOriginalTransactionId_key" ON "Subscription"("revenueCatOriginalTransactionId");
