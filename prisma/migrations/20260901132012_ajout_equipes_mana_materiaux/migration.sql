-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('GRIFFE', 'CROC', 'OS', 'CUIR', 'ESSENCE_ELEMENTAIRE');

-- AlterTable
ALTER TABLE "Monster" ADD COLUMN     "xpGain" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "Personnage" ADD COLUMN     "mana" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "Spell" ADD COLUMN     "manaCost" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembre" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "personnageId" TEXT NOT NULL,

    CONSTRAINT "TeamMembre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialStack" (
    "id" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "MaterialStack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembre_teamId_position_key" ON "TeamMembre"("teamId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembre_teamId_personnageId_key" ON "TeamMembre"("teamId", "personnageId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialStack_ownerId_type_key" ON "MaterialStack"("ownerId", "type");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembre" ADD CONSTRAINT "TeamMembre_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembre" ADD CONSTRAINT "TeamMembre_personnageId_fkey" FOREIGN KEY ("personnageId") REFERENCES "Personnage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialStack" ADD CONSTRAINT "MaterialStack_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
