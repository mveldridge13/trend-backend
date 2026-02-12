-- Baseline migration for security features
-- This migration captures all changes applied via db push
-- These changes are already in the database, so this file is for tracking only

-- CreateEnum: AuditEventType
CREATE TYPE "AuditEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'ACCOUNT_LOCKED', 'TOKEN_REFRESH');

-- CreateEnum: LoanTerm
CREATE TYPE "LoanTerm" AS ENUM ('ONE_YEAR', 'THREE_YEARS', 'FIVE_YEARS', 'SEVEN_YEARS');

-- CreateEnum: RolloverType
CREATE TYPE "RolloverType" AS ENUM ('ROLLOVER', 'GOAL_ALLOCATION');

-- AlterEnum: Add ROLLOVER to ContributionType
ALTER TYPE "ContributionType" ADD VALUE 'ROLLOVER';

-- CreateTable: refresh_tokens
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceName" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" "AuditEventType" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: password_history
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rollover_entries
CREATE TABLE "rollover_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "RolloverType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "description" TEXT,

    CONSTRAINT "rollover_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rollover_notifications
CREATE TABLE "rollover_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fromPeriod" TEXT NOT NULL DEFAULT 'last period',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "rollover_notifications_pkey" PRIMARY KEY ("id")
);

-- AlterTable: users - Add security fields
ALTER TABLE "users" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lockedUntil" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "lastFailedLogin" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "rolloverAmount" DECIMAL(12,2);
ALTER TABLE "users" ADD COLUMN "lastRolloverDate" TIMESTAMP(3);

-- AlterTable: goals - Add loan fields
ALTER TABLE "goals" ADD COLUMN "loanTerm" "LoanTerm";
ALTER TABLE "goals" ADD COLUMN "interestRate" DECIMAL(5,2);
ALTER TABLE "goals" ADD COLUMN "minimumPayment" DECIMAL(12,2);

-- CreateIndex: refresh_tokens
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex: audit_logs
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX "audit_logs_eventType_createdAt_idx" ON "audit_logs"("eventType", "createdAt");
CREATE INDEX "audit_logs_ipAddress_createdAt_idx" ON "audit_logs"("ipAddress", "createdAt");

-- CreateIndex: password_history
CREATE INDEX "password_history_userId_createdAt_idx" ON "password_history"("userId", "createdAt");

-- CreateIndex: rollover_entries
CREATE INDEX "rollover_entries_userId_date_idx" ON "rollover_entries"("userId", "date");

-- CreateIndex: rollover_notifications
CREATE UNIQUE INDEX "rollover_notifications_userId_key" ON "rollover_notifications"("userId");
CREATE INDEX "rollover_notifications_userId_dismissedAt_idx" ON "rollover_notifications"("userId", "dismissedAt");

-- AddForeignKey: refresh_tokens
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: rollover_entries
ALTER TABLE "rollover_entries" ADD CONSTRAINT "rollover_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: rollover_notifications
ALTER TABLE "rollover_notifications" ADD CONSTRAINT "rollover_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
