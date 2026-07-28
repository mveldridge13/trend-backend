-- AlterEnum
ALTER TYPE "GameType" ADD VALUE 'ADD_ON';

-- AlterTable
ALTER TABLE "poker_tournament_events" ADD COLUMN     "addOnAmount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "addOnStack" INTEGER DEFAULT 0,
ADD COLUMN     "addOnPurchased" BOOLEAN NOT NULL DEFAULT false;
