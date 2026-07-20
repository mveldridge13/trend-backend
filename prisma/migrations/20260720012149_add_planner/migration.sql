-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('PURCHASE', 'INCOME', 'BILL_CHANGE', 'GOAL_CHANGE', 'DEBT_PAYMENT');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'PLANNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlanDirection" AS ENUM ('INFLOW', 'OUTFLOW');

-- CreateEnum
CREATE TYPE "PlanLinkedEntityType" AS ENUM ('TRANSACTION', 'GOAL');

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PlanType" NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "direction" "PlanDirection" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "linkedEntityType" "PlanLinkedEntityType",
    "linkedEntityId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planner_settings" (
    "userId" TEXT NOT NULL,
    "safetyBufferAmount" DECIMAL(12,2),
    "startingBalance" DECIMAL(12,2),
    "startingBalanceAsOf" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planner_settings_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "plans_userId_status_idx" ON "plans"("userId", "status");

-- CreateIndex
CREATE INDEX "plans_userId_plannedDate_idx" ON "plans"("userId", "plannedDate");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner_settings" ADD CONSTRAINT "planner_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
