/*
  Warnings:

  - The `gameType` column on the `poker_tournament_events` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('NO_LIMIT_HOLDEM', 'SATELLITE', 'FREEZEOUT', 'BOUNTY', 'TURBO', 'DEEPSTACK', 'TEAM_EVENT');

-- AlterTable
ALTER TABLE "poker_tournament_events" DROP COLUMN "gameType",
ADD COLUMN     "gameType" "GameType";
