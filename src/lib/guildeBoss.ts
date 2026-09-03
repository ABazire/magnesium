/**
 * Boss de guilde coopératif.
 *
 * Un seul boss actif par guilde, avec une réserve de vie partagée. Chaque
 * membre peut l'attaquer un nombre limité de fois par jour ; les dégâts
 * dépendent de la puissance de son meilleur personnage. Quand le boss tombe,
 * une récompense est distribuée à tous les contributeurs du cycle,
 * proportionnellement aux dégâts infligés, puis un boss plus costaud repop.
 *
 * Les constantes ci-dessous sont calées sur la puissance (somme force +
 * vitesse + résistance + agilité) d'une équipe au niveau max de sa rareté,
 * qui va d'environ 48 (1★) à 344 (6★) — voir scripts/equilibrage.ts pour la
 * même mesure appliquée au reste du jeu. Elles n'ont pas d'équivalent
 * « vérifiable » comme l'équilibrage PvE : c'est un point de départ
 * raisonnable, à ajuster une fois le contenu joué en vrai.
 */

export const MAX_ATTAQUES_PAR_JOUR = 3;
export const OR_PAR_ATTAQUE_BOSS = 20;

const VIE_BASE_BOSS_GUILDE = 6000;
const VIE_PAR_MEMBRE_BOSS_GUILDE = 1800;
/** +15% de vie max par cycle : le boss doit rester un défi après chaque victoire. */
const CROISSANCE_PAR_CYCLE = 1.15;

const BONUS_POOL_BASE = 400;
const BONUS_POOL_PAR_MEMBRE = 40;

export function vieMaxBoss(nombreMembres: number, cycle: number): number {
  const base = VIE_BASE_BOSS_GUILDE + nombreMembres * VIE_PAR_MEMBRE_BOSS_GUILDE;
  return Math.round(base * Math.pow(CROISSANCE_PAR_CYCLE, cycle - 1));
}

export function poolRecompenseCycle(nombreMembres: number): number {
  return BONUS_POOL_BASE + nombreMembres * BONUS_POOL_PAR_MEMBRE;
}

/** Dégâts infligés par une attaque, à partir de la puissance du combattant engagé. */
export function degatsAttaqueBoss(puissance: number): number {
  return Math.max(1, Math.round(puissance));
}

export function jourCourant(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
