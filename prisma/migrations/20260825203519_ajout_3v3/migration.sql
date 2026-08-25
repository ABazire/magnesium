-- CreateEnum
CREATE TYPE "FormationRow" AS ENUM ('AVANT', 'ARRIERE');

-- AlterTable
ALTER TABLE "Personnage" ADD COLUMN     "formationRow" "FormationRow" NOT NULL DEFAULT 'AVANT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rankPoints3v3" INTEGER NOT NULL DEFAULT 1000;

-- CreateTable
CREATE TABLE "TeamFight" (
    "id" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seed" INTEGER NOT NULL,
    "events" JSONB NOT NULL,
    "winnerSide" TEXT NOT NULL,
    "attackerUserId" TEXT NOT NULL,
    "defenderUserId" TEXT NOT NULL,
    "fightersA" JSONB NOT NULL,
    "fightersB" JSONB NOT NULL,

    CONSTRAINT "TeamFight_pkey" PRIMARY KEY ("id")
);
