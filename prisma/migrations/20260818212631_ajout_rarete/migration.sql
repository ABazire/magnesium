/*
  Warnings:

  - Added the required column `rarityId` to the `Personnage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Personnage" ADD COLUMN     "rarityId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Rarity" (
    "id" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "statMin" INTEGER NOT NULL,
    "statMax" INTEGER NOT NULL,
    "dropRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Rarity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rarity_stars_key" ON "Rarity"("stars");

-- AddForeignKey
ALTER TABLE "Personnage" ADD CONSTRAINT "Personnage_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
