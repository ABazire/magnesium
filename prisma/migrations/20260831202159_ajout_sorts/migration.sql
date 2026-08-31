-- CreateEnum
CREATE TYPE "SpellType" AS ENUM ('ACTIF', 'PASSIF');

-- CreateEnum
CREATE TYPE "SpellEffect" AS ENUM ('DEGATS', 'SOIN', 'ETOURDISSEMENT', 'BONUS_STAT', 'REDUCTION_DEGATS');

-- CreateEnum
CREATE TYPE "SpellSlot" AS ENUM ('SORT_1', 'SORT_2', 'SORT_3', 'PASSIF');

-- CreateTable
CREATE TABLE "Spell" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SpellType" NOT NULL,
    "effect" "SpellEffect" NOT NULL,
    "value" INTEGER NOT NULL,
    "targetStat" "StatType",
    "cooldown" INTEGER NOT NULL DEFAULT 3,
    "rarityId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Spell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonnageSpell" (
    "id" TEXT NOT NULL,
    "personnageId" TEXT NOT NULL,
    "spellId" TEXT NOT NULL,
    "slot" "SpellSlot" NOT NULL,

    CONSTRAINT "PersonnageSpell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonnageSpell_spellId_key" ON "PersonnageSpell"("spellId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonnageSpell_personnageId_slot_key" ON "PersonnageSpell"("personnageId", "slot");

-- AddForeignKey
ALTER TABLE "Spell" ADD CONSTRAINT "Spell_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spell" ADD CONSTRAINT "Spell_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageSpell" ADD CONSTRAINT "PersonnageSpell_personnageId_fkey" FOREIGN KEY ("personnageId") REFERENCES "Personnage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageSpell" ADD CONSTRAINT "PersonnageSpell_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
