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

async function main() {
  for (const rarete of RARETES) {
    await prisma.rarity.upsert({
      where: { stars: rarete.stars },
      update: rarete,
      create: rarete,
    });
  }
  console.log("Raretés créées.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
