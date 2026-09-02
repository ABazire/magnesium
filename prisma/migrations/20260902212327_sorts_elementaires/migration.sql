-- CreateEnum
CREATE TYPE "SpellElement" AS ENUM ('NEUTRE', 'FEU', 'GLACE', 'FOUDRE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SpellEffect" ADD VALUE 'BRULURE';
ALTER TYPE "SpellEffect" ADD VALUE 'DEGATS_ZONE';
ALTER TYPE "SpellEffect" ADD VALUE 'RALENTISSEMENT';
ALTER TYPE "SpellEffect" ADD VALUE 'REGENERATION';
ALTER TYPE "SpellEffect" ADD VALUE 'VOL_DE_VIE';
ALTER TYPE "SpellEffect" ADD VALUE 'EPINES';
ALTER TYPE "SpellEffect" ADD VALUE 'CRITIQUE';

-- AlterTable
ALTER TABLE "Spell" ADD COLUMN     "duree" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "element" "SpellElement" NOT NULL DEFAULT 'NEUTRE';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "energy" SET DEFAULT 600;
