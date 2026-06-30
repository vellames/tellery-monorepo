-- Rename the quota column from availableSessions to availableCredits.
-- Data is preserved (existing credit counts are kept).
ALTER TABLE "User" RENAME COLUMN "availableSessions" TO "availableCredits";
