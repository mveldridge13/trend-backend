-- AlterEnum
ALTER TYPE "ContributionType" ADD VALUE 'WITHDRAWAL';

-- CreateTable
CREATE TABLE "poker_tournaments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "venue" TEXT,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3),
    "accommodationCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "foodBudget" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "otherExpenses" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poker_tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poker_tournament_events" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventNumber" TEXT,
    "buyIn" DECIMAL(10,2) NOT NULL,
    "winnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "gameType" TEXT,
    "fieldSize" INTEGER,
    "finishPosition" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poker_tournament_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "poker_tournaments_userId_dateStart_idx" ON "poker_tournaments"("userId", "dateStart");

-- CreateIndex
CREATE INDEX "poker_tournament_events_tournamentId_eventDate_idx" ON "poker_tournament_events"("tournamentId", "eventDate");

-- CreateIndex
CREATE INDEX "poker_tournament_events_userId_eventDate_idx" ON "poker_tournament_events"("userId", "eventDate");

-- AddForeignKey
ALTER TABLE "poker_tournaments" ADD CONSTRAINT "poker_tournaments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poker_tournament_events" ADD CONSTRAINT "poker_tournament_events_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "poker_tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poker_tournament_events" ADD CONSTRAINT "poker_tournament_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
