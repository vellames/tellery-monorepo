-- AlterTable
ALTER TABLE "ObjectSessionState" ADD COLUMN     "locationStateId" TEXT;

-- CreateIndex
CREATE INDEX "ObjectSessionState_locationStateId_idx" ON "ObjectSessionState"("locationStateId");

-- AddForeignKey
ALTER TABLE "ObjectSessionState" ADD CONSTRAINT "ObjectSessionState_locationStateId_fkey" FOREIGN KEY ("locationStateId") REFERENCES "LocationSessionState"("id") ON DELETE SET NULL ON UPDATE CASCADE;
