-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MaterialType" ADD VALUE 'PLUME';
ALTER TYPE "MaterialType" ADD VALUE 'ECAILLE_CRISTAL';

-- CreateTable
CREATE TABLE "PersonnageFragment" (
    "id" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "PersonnageFragment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonnageFragment_ownerId_stars_key" ON "PersonnageFragment"("ownerId", "stars");

-- AddForeignKey
ALTER TABLE "PersonnageFragment" ADD CONSTRAINT "PersonnageFragment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
