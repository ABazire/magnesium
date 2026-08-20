/*
  Warnings:

  - Added the required column `vie` to the `Personnage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Personnage" ADD COLUMN     "vie" INTEGER NOT NULL;
