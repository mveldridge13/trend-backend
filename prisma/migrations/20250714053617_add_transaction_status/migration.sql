-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UPCOMING', 'PAID', 'OVERDUE');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "status" "PaymentStatus";
