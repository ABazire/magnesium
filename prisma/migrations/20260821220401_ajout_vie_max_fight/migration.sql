/*
  Warnings:

  - Added the required column `attackerVieMax` to the `Fight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defenderVieMax` to the `Fight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Fight" ADD COLUMN     "attackerVieMax" INTEGER NOT NULL,
ADD COLUMN     "defenderVieMax" INTEGER NOT NULL;
