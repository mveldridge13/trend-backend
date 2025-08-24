-- AlterTable
ALTER TABLE "poker_tournament_events" ADD COLUMN     "reBuyAmount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "reBuys" INTEGER DEFAULT 0;
