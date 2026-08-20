-- CreateEnum
CREATE TYPE "EquipmentSlot" AS ENUM ('ARME', 'ARMURE', 'BOTTES', 'AMULETTE');

-- CreateEnum
CREATE TYPE "StatType" AS ENUM ('FORCE', 'VITESSE', 'RESISTANCE', 'AGILITE');

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" "EquipmentSlot" NOT NULL,
    "bonusStat" "StatType" NOT NULL,
    "bonusValue" INTEGER NOT NULL,
    "rarityId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonnageEquipment" (
    "id" TEXT NOT NULL,
    "personnageId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "slot" "EquipmentSlot" NOT NULL,

    CONSTRAINT "PersonnageEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonnageEquipment_equipmentId_key" ON "PersonnageEquipment"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonnageEquipment_personnageId_slot_key" ON "PersonnageEquipment"("personnageId", "slot");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageEquipment" ADD CONSTRAINT "PersonnageEquipment_personnageId_fkey" FOREIGN KEY ("personnageId") REFERENCES "Personnage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageEquipment" ADD CONSTRAINT "PersonnageEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
