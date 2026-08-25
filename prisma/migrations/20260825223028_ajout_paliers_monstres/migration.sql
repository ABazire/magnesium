/*
  Warnings:

  - A unique constraint covering the columns `[baseName,tier]` on the table `Monster` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AdventureAttempt" ADD COLUMN     "victory" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Monster" ADD COLUMN     "baseName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "gainDefaite" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gainVictoire" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tier" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "MonsterUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseName" TEXT NOT NULL,
    "highestTierUnlocked" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MonsterUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonsterUnlock_userId_baseName_key" ON "MonsterUnlock"("userId", "baseName");

-- CreateIndex
CREATE UNIQUE INDEX "Monster_baseName_tier_key" ON "Monster"("baseName", "tier");
