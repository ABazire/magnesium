import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const RARETES = [
  { stars: 1, statMin: 0, statMax: 5, dropRate: 40 },
  { stars: 2, statMin: 3, statMax: 10, dropRate: 30 },
  { stars: 3, statMin: 8, statMax: 15, dropRate: 20 },
  { stars: 4, statMin: 13, statMax: 20, dropRate: 7 },
  { stars: 5, statMin: 18, statMax: 25, dropRate: 2.5 },
  { stars: 6, statMin: 23, statMax: 30, dropRate: 0.5 },
];

const MONSTRES = [
  {
    baseName: "Loup",
    tier: 1,
    name: "Loup I",
    vie: 10,
    force: 5,
    vitesse: 5,
    resistance: 6,
    agilite: 5,
    gainVictoire: 30,
    gainDefaite: 10,
  },
  {
    baseName: "Loup",
    tier: 2,
    name: "Loup II",
    vie: 60,
    force: 18,
    vitesse: 18,
    resistance: 9,
    agilite: 13,
    gainVictoire: 45,
    gainDefaite: 15,
  },
  {
    baseName: "Loup",
    tier: 3,
    name: "Loup III",
    vie: 85,
    force: 25,
    vitesse: 22,
    resistance: 13,
    agilite: 17,
    gainVictoire: 65,
    gainDefaite: 20,
  },
  {
    baseName: "Loup",
    tier: 4,
    name: "Loup IV",
    vie: 115,
    force: 33,
    vitesse: 27,
    resistance: 18,
    agilite: 22,
    gainVictoire: 90,
    gainDefaite: 28,
  },
  {
    baseName: "Loup",
    tier: 5,
    name: "Loup V",
    vie: 150,
    force: 42,
    vitesse: 33,
    resistance: 24,
    agilite: 28,
    gainVictoire: 120,
    gainDefaite: 36,
  },

  {
    baseName: "Ours",
    tier: 1,
    name: "Ours I",
    vie: 70,
    force: 18,
    vitesse: 6,
    resistance: 14,
    agilite: 4,
    gainVictoire: 30,
    gainDefaite: 10,
  },
  {
    baseName: "Ours",
    tier: 2,
    name: "Ours II",
    vie: 95,
    force: 25,
    vitesse: 8,
    resistance: 19,
    agilite: 6,
    gainVictoire: 45,
    gainDefaite: 15,
  },
  {
    baseName: "Ours",
    tier: 3,
    name: "Ours III",
    vie: 125,
    force: 33,
    vitesse: 10,
    resistance: 25,
    agilite: 8,
    gainVictoire: 65,
    gainDefaite: 20,
  },
  {
    baseName: "Ours",
    tier: 4,
    name: "Ours IV",
    vie: 160,
    force: 42,
    vitesse: 13,
    resistance: 32,
    agilite: 11,
    gainVictoire: 90,
    gainDefaite: 28,
  },
  {
    baseName: "Ours",
    tier: 5,
    name: "Ours V",
    vie: 200,
    force: 52,
    vitesse: 16,
    resistance: 40,
    agilite: 14,
    gainVictoire: 120,
    gainDefaite: 36,
  },
];

async function main() {
  for (const rarete of RARETES) {
    await prisma.rarity.upsert({
      where: { stars: rarete.stars },
      update: rarete,
      create: rarete,
    });
  }

  for (const monstre of MONSTRES) {
    await prisma.monster.upsert({
      where: {
        baseName_tier: { baseName: monstre.baseName, tier: monstre.tier },
      },
      update: monstre,
      create: monstre,
    });
  }

  console.log("Raretés et monstres créés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
