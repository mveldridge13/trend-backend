-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "location" TEXT,
ADD COLUMN     "merchantName" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recurrence" TEXT,
ADD COLUMN     "subcategoryId" TEXT;

-- CreateIndex
CREATE INDEX "transactions_subcategoryId_idx" ON "transactions"("subcategoryId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
