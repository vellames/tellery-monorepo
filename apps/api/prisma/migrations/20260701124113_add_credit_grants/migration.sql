-- CreateTable
CREATE TABLE "CreditGrant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CreditGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditGrant_stripeInvoiceId_key" ON "CreditGrant"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "CreditGrant_subscriptionId_idx" ON "CreditGrant"("subscriptionId");

-- CreateIndex
CREATE INDEX "CreditGrant_userId_idx" ON "CreditGrant"("userId");

-- AddForeignKey
ALTER TABLE "CreditGrant" ADD CONSTRAINT "CreditGrant_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
