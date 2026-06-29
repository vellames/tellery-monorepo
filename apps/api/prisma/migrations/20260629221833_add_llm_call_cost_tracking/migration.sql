-- CreateEnum
CREATE TYPE "LlmCallPurpose" AS ENUM ('intent', 'character', 'object');

-- CreateTable
CREATE TABLE "LlmCall" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "purpose" "LlmCallPurpose" NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "costUsdNanos" BIGINT NOT NULL,
    "latencyMs" INTEGER,

    CONSTRAINT "LlmCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LlmCall_sessionId_idx" ON "LlmCall"("sessionId");

-- CreateIndex
CREATE INDEX "LlmCall_createdAt_idx" ON "LlmCall"("createdAt");

-- AddForeignKey
ALTER TABLE "LlmCall" ADD CONSTRAINT "LlmCall_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
