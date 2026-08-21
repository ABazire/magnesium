-- CreateTable
CREATE TABLE "Monster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vie" INTEGER NOT NULL,
    "force" INTEGER NOT NULL,
    "vitesse" INTEGER NOT NULL,
    "resistance" INTEGER NOT NULL,
    "agilite" INTEGER NOT NULL,

    CONSTRAINT "Monster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Monster_name_key" ON "Monster"("name");
