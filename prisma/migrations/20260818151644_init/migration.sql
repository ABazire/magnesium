-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personnage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "force" INTEGER NOT NULL,
    "vitesse" INTEGER NOT NULL,
    "resistance" INTEGER NOT NULL,
    "agilite" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Personnage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Personnage" ADD CONSTRAINT "Personnage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
