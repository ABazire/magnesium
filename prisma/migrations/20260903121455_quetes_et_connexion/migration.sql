-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginJour" TEXT,
ADD COLUMN     "loginStreak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "QuestProgress" (
    "id" TEXT NOT NULL,
    "jour" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "progres" INTEGER NOT NULL DEFAULT 0,
    "reclame" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestProgress_ownerId_jour_cle_key" ON "QuestProgress"("ownerId", "jour", "cle");

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
