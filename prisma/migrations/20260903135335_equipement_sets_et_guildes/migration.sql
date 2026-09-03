-- CreateEnum
CREATE TYPE "EquipmentSet" AS ENUM ('FORCE', 'ENDURANCE', 'CELERITE', 'PRECISION', 'REMPART');

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "ensemble" "EquipmentSet",
ADD COLUMN     "niveau" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "guildeId" TEXT;

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaderId" TEXT NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildBoss" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "vieMax" INTEGER NOT NULL,
    "vie" INTEGER NOT NULL,
    "cycleTermine" BOOLEAN NOT NULL DEFAULT false,
    "demarreLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildBoss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildBossContribution" (
    "id" TEXT NOT NULL,
    "bossId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL,
    "degats" INTEGER NOT NULL DEFAULT 0,
    "attaquesAujourdhui" INTEGER NOT NULL DEFAULT 0,
    "dernierJour" TEXT,

    CONSTRAINT "GuildBossContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_name_key" ON "Guild"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GuildBoss_guildId_key" ON "GuildBoss"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "GuildBossContribution_bossId_userId_cycle_key" ON "GuildBossContribution"("bossId", "userId", "cycle");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_guildeId_fkey" FOREIGN KEY ("guildeId") REFERENCES "Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildBoss" ADD CONSTRAINT "GuildBoss_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildBossContribution" ADD CONSTRAINT "GuildBossContribution_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "GuildBoss"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildBossContribution" ADD CONSTRAINT "GuildBossContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
