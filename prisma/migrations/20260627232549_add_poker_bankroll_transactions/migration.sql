-- CreateEnum
CREATE TYPE "PokerBankrollTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateTable
CREATE TABLE "poker_bankroll_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PokerBankrollTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poker_bankroll_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "poker_bankroll_transactions_userId_date_idx" ON "poker_bankroll_transactions"("userId", "date");

-- AddForeignKey
ALTER TABLE "poker_bankroll_transactions" ADD CONSTRAINT "poker_bankroll_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
