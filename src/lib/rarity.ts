import { prisma } from "@/lib/prisma";

async function tirageDansPlage(minStars: number, maxStars: number) {
  const raretes = await prisma.rarity.findMany({
    where: { stars: { gte: minStars, lte: maxStars } },
  });

  if (raretes.length === 0) {
    throw new Error(`Aucune rareté trouvée entre ${minStars}★ et ${maxStars}★`);
  }

  const total = raretes.reduce((somme, r) => somme + r.dropRate, 0);
  let tirage = Math.random() * total;

  for (const rarete of raretes) {
    if (tirage < rarete.dropRate) return rarete;
    tirage -= rarete.dropRate;
  }

  return raretes[raretes.length - 1];
}

export async function tirerRarete() {
  return tirageDansPlage(1, 3);
}

export async function tirerRaretePremium() {
  return tirageDansPlage(3, 6);
}
