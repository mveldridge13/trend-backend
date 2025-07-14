-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "originalCategory" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "dueDate" TIMESTAMP(3);
