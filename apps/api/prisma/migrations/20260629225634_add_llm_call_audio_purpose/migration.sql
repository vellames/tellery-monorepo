-- AlterEnum
ALTER TYPE "LlmCallPurpose" ADD VALUE 'audio';

-- AlterTable
ALTER TABLE "LlmCall" ADD COLUMN     "audioSeconds" INTEGER;
