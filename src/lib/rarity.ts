import { prisma } from "@/lib/prisma";

export async function tirerRarete() {
  const raretes = await prisma.rarity.findMany();

  if (raretes.length === 0) {
    throw new Error(
      "Aucune rareté en base — as-tu lancé `npx prisma db seed` ?",
    );
  }

  const total = raretes.reduce((somme, r) => somme + r.dropRate, 0);
  let tirage = Math.random() * total;

  for (const rarete of raretes) {
    if (tirage < rarete.dropRate) {
      return rarete;
    }
    tirage -= rarete.dropRate;
  }

  return raretes[raretes.length - 1];
}
