-- CreateTable
CREATE TABLE "AdventureAttempt" (
    "id" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personnageId" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,

    CONSTRAINT "AdventureAttempt_pkey" PRIMARY KEY ("id")
);
