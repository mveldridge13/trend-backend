-- CreateEnum
CREATE TYPE "RolloverType" AS ENUM ('AUTOMATIC', 'MANUAL');

-- AlterEnum
ALTER TYPE "ContributionType" ADD VALUE 'ROLLOVER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastRolloverDate" TIMESTAMP(3),
ADD COLUMN     "rolloverAmount" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "rollover_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "RolloverType" NOT NULL,
    "budgetPeriodStart" TIMESTAMP(3) NOT NULL,
    "budgetPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rollover_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rollover_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "rollover_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rollover_entries_userId_date_idx" ON "rollover_entries"("userId", "date");

-- CreateIndex
CREATE INDEX "rollover_notifications_userId_dismissedAt_idx" ON "rollover_notifications"("userId", "dismissedAt");

-- CreateIndex
CREATE UNIQUE INDEX "rollover_notifications_userId_key" ON "rollover_notifications"("userId");

-- AddForeignKey
ALTER TABLE "rollover_entries" ADD CONSTRAINT "rollover_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollover_notifications" ADD CONSTRAINT "rollover_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
