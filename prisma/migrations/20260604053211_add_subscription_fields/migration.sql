-- CreateEnum
CREATE TYPE "SubscriptionProvider" AS ENUM ('APPLE', 'GOOGLE', 'STRIPE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isPro" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proExpiresAt" TIMESTAMP(3),
ADD COLUMN     "rcCustomerId" TEXT,
ADD COLUMN     "subscriptionProvider" "SubscriptionProvider";
