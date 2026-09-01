import { prisma } from "@/lib/prisma";
import {
  ENERGY_MAX,
  ENERGY_COUT_COMBAT,
  COUPONS_MAX,
  COUPONS_COUT_COMBAT,
} from "@/lib/energyConstants";

export { ENERGY_MAX, ENERGY_COUT_COMBAT, COUPONS_MAX, COUPONS_COUT_COMBAT };

const ENERGY_INTERVALLE_MS = 1 * 60 * 1000; // 1 minute par point
const COUPONS_INTERVALLE_MS = 15 * 60 * 1000; // 15 minutes par point

function calculerRegen(
  valeur: number,
  derniereMaj: Date,
  max: number,
  intervalleMs: number,
) {
  if (valeur >= max) return { valeur: max, derniereMaj: new Date() };

  const ecouleMs = Date.now() - derniereMaj.getTime();
  const pointsGagnes = Math.floor(ecouleMs / intervalleMs);
  if (pointsGagnes <= 0) return { valeur, derniereMaj };

  const nouvelleValeur = Math.min(max, valeur + pointsGagnes);
  const nouvelleDate =
    nouvelleValeur >= max
      ? new Date()
      : new Date(derniereMaj.getTime() + pointsGagnes * intervalleMs);

  return { valeur: nouvelleValeur, derniereMaj: nouvelleDate };
}

export async function obtenirEnergieActuelle(userId: string): Promise<number> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { valeur, derniereMaj } = calculerRegen(
    user.energy,
    user.energyUpdatedAt,
    ENERGY_MAX,
    ENERGY_INTERVALLE_MS,
  );

  if (valeur !== user.energy) {
    await prisma.user.update({
      where: { id: userId },
      data: { energy: valeur, energyUpdatedAt: derniereMaj },
    });
  }
  return valeur;
}

export async function obtenirCouponsActuels(userId: string): Promise<number> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { valeur, derniereMaj } = calculerRegen(
    user.coupons,
    user.couponsUpdatedAt,
    COUPONS_MAX,
    COUPONS_INTERVALLE_MS,
  );

  if (valeur !== user.coupons) {
    await prisma.user.update({
      where: { id: userId },
      data: { coupons: valeur, couponsUpdatedAt: derniereMaj },
    });
  }
  return valeur;
}

// src/lib/energy.ts (ajout)
export async function getEnergieEtCoupons(userId: string) {
  const [energy, coupons] = await Promise.all([
    obtenirEnergieActuelle(userId),
    obtenirCouponsActuels(userId),
  ]);
  return { energy, coupons };
}
