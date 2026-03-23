-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "linkedGoalId" TEXT;

-- CreateIndex
CREATE INDEX "transactions_linkedGoalId_idx" ON "transactions"("linkedGoalId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_linkedGoalId_fkey" FOREIGN KEY ("linkedGoalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
