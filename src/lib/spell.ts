import { SpellType, SpellEffect, StatType } from "@prisma/client";

export const NOMS_SORT: Record<
  "DEGATS" | "SOIN" | "ETOURDISSEMENT" | "REDUCTION_DEGATS",
  string[]
> = {
  DEGATS: ["Frappe brutale", "Lame ardente", "Coup fatal"],
  SOIN: ["Chant de vie", "Bénédiction", "Rosée curative"],
  ETOURDISSEMENT: ["Choc paralysant", "Onde de stase", "Cri assourdissant"],
  REDUCTION_DEGATS: ["Carapace runique", "Bouclier spectral", "Peau de pierre"],
};

export const NOMS_BONUS_STAT: Record<StatType, string[]> = {
  FORCE: ["Rage intérieure", "Fureur latente"],
  VITESSE: ["Réflexes aiguisés", "Foulée légère"],
  RESISTANCE: ["Endurance de fer", "Volonté inébranlable"],
  AGILITE: ["Instinct félin", "Grâce innée"],
};

const EFFETS_ACTIFS = [
  SpellEffect.DEGATS,
  SpellEffect.SOIN,
  SpellEffect.ETOURDISSEMENT,
] as const;

const EFFETS_PASSIFS = [
  SpellEffect.BONUS_STAT,
  SpellEffect.REDUCTION_DEGATS,
] as const;

const STATS: StatType[] = [
  StatType.FORCE,
  StatType.VITESSE,
  StatType.RESISTANCE,
  StatType.AGILITE,
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Plus la rareté est élevée, plus le sort actif revient vite (cooldown court).
function cooldownParRarete(stars: number): number {
  return Math.max(2, 8 - stars);
}

// Sorts plus rares = plus puissants mais aussi plus coûteux en mana.
function manaCoutParRarete(stars: number): number {
  return 10 + (stars - 1) * 4;
}

export function descriptionSort(s: {
  effect: string;
  value: number;
  targetStat: string | null;
  manaCost?: number;
}) {
  const cout = s.manaCost ? ` · ${s.manaCost} mana` : "";

  switch (s.effect) {
    case "DEGATS":
      return `+${s.value}% dégâts${cout}`;
    case "SOIN":
      return `Soigne ${s.value}% PV${cout}`;
    case "ETOURDISSEMENT":
      return `Étourdit ${s.value} tour(s)${cout}`;
    case "REDUCTION_DEGATS":
      return `-${s.value}% dégâts subis`;
    case "BONUS_STAT":
      return `+${s.value} ${s.targetStat}`;
    default:
      return "";
  }
}

export type SortGenere = {
  name: string;
  type: SpellType;
  effect: SpellEffect;
  value: number;
  targetStat: StatType | null;
  cooldown: number;
  manaCost: number;
  rarityId: string;
};

export function genererSort(rarete: {
  id: string;
  stars: number;
  statMin: number;
  statMax: number;
}): SortGenere {
  const type = Math.random() < 0.75 ? SpellType.ACTIF : SpellType.PASSIF;
  const effect = pick(type === SpellType.ACTIF ? EFFETS_ACTIFS : EFFETS_PASSIFS);
  const cooldown = cooldownParRarete(rarete.stars);
  const manaCost = type === SpellType.ACTIF ? manaCoutParRarete(rarete.stars) : 0;

  switch (effect) {
    case SpellEffect.DEGATS:
      return {
        name: pick(NOMS_SORT.DEGATS),
        type,
        effect,
        // % de dégâts bonus appliqués en plus d'une attaque normale
        value: 20 + (rarete.stars - 1) * 20,
        targetStat: null,
        cooldown,
        manaCost,
        rarityId: rarete.id,
      };
    case SpellEffect.SOIN:
      return {
        name: pick(NOMS_SORT.SOIN),
        type,
        effect,
        // % des PV max du lanceur rendus
        value: 10 + (rarete.stars - 1) * 5,
        targetStat: null,
        cooldown,
        manaCost,
        rarityId: rarete.id,
      };
    case SpellEffect.ETOURDISSEMENT:
      return {
        name: pick(NOMS_SORT.ETOURDISSEMENT),
        type,
        effect,
        // Nombre de tours sautés par la cible ; fixe pour éviter un stun-lock
        value: 1,
        targetStat: null,
        cooldown,
        manaCost,
        rarityId: rarete.id,
      };
    case SpellEffect.REDUCTION_DEGATS:
      return {
        name: pick(NOMS_SORT.REDUCTION_DEGATS),
        type,
        effect,
        // % de dégâts subis en moins, en permanence
        value: 5 + (rarete.stars - 1) * 5,
        targetStat: null,
        cooldown,
        manaCost,
        rarityId: rarete.id,
      };
    case SpellEffect.BONUS_STAT: {
      const stat = pick(STATS);
      return {
        name: pick(NOMS_BONUS_STAT[stat]),
        type,
        effect,
        value:
          Math.floor(Math.random() * (rarete.statMax - rarete.statMin + 1)) +
          rarete.statMin,
        targetStat: stat,
        cooldown,
        manaCost,
        rarityId: rarete.id,
      };
    }
  }
}
