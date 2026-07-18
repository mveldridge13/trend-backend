-- AlterTable
ALTER TABLE "income_sources" ADD COLUMN     "lastRolloverDate" TIMESTAMP(3),
ADD COLUMN     "rolloverAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "income_source_rollover_notifications" (
    "id" TEXT NOT NULL,
    "incomeSourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fromPeriod" TEXT NOT NULL DEFAULT 'last period',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "income_source_rollover_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "income_source_rollover_notifications_incomeSourceId_key" ON "income_source_rollover_notifications"("incomeSourceId");

-- CreateIndex
CREATE INDEX "income_source_rollover_notifications_userId_dismissedAt_idx" ON "income_source_rollover_notifications"("userId", "dismissedAt");

-- AddForeignKey
ALTER TABLE "income_source_rollover_notifications" ADD CONSTRAINT "income_source_rollover_notifications_incomeSourceId_fkey" FOREIGN KEY ("incomeSourceId") REFERENCES "income_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_source_rollover_notifications" ADD CONSTRAINT "income_source_rollover_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
