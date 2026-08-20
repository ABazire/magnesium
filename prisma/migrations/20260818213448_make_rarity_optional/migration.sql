-- DropForeignKey
ALTER TABLE "Personnage" DROP CONSTRAINT "Personnage_rarityId_fkey";

-- AlterTable
ALTER TABLE "Personnage" ALTER COLUMN "rarityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Personnage" ADD CONSTRAINT "Personnage_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
