-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "localUuid" TEXT NOT NULL,
    "queryParams" TEXT,
    "name" TEXT,
    "email" TEXT,
    "isPasswordTouched" BOOLEAN NOT NULL DEFAULT false,
    "isConfirmPasswordTouched" BOOLEAN NOT NULL DEFAULT false,
    "isPrivacyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isTermsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_localUuid_idx" ON "Lead"("localUuid");

-- CreateIndex
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
