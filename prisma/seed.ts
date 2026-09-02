import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { MONSTRES, RARETES } from "./donnees";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
