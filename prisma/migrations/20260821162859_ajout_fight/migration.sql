-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seed" INTEGER NOT NULL,
    "turns" JSONB NOT NULL,
    "winnerId" TEXT NOT NULL,
    "attackerPersonnageId" TEXT NOT NULL,
    "defenderPersonnageId" TEXT NOT NULL,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);
