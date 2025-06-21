-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hasSeenAddTransactionTour" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSeenBalanceCardTour" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSeenTransactionSwipeTour" BOOLEAN NOT NULL DEFAULT false;
