import {
  SpellType,
  SpellEffect,
  SpellElement,
  StatType,
} from "@prisma/client";

/**
 * Catalogue et génération des sorts.
 *
 * Chaque effet est décrit une seule fois, avec sa famille (actif ou passif),
 * son élément, ses noms et la façon dont sa puissance suit la rareté. Ajouter
 * un sort revient à ajouter une entrée ici : la génération, l'affichage et la
 * pondération des tirages s'y adaptent seuls.
 */

export type DefinitionSort = {
  effect: SpellEffect;
  type: SpellType;
  element: SpellElement;
  noms: string[];
  /** Puissance au 1★, puis gain par étoile supplémentaire. */
  base: number;
  parEtoile: number;
  /** Durée en tours (brûlure, ralentissement) ; 0 si l'effet est immédiat. */
  duree?: number;
  /** Poids du tirage : les effets les plus forts sortent moins souvent. */
  poids: number;
};

export const CATALOGUE_SORTS: DefinitionSort[] = [
  // ---------------------------------------------------------------- Actifs
  {
    effect: SpellEffect.DEGATS,
    type: SpellType.ACTIF,
    element: SpellElement.NEUTRE,
    noms: ["Frappe brutale", "Coup fatal", "Estocade", "Taillade"],
    base: 20,
    parEtoile: 10,
    poids: 22,
  },
  {
    effect: SpellEffect.BRULURE,
    type: SpellType.ACTIF,
    element: SpellElement.FEU,
    noms: ["Lame ardente", "Morsure de braise", "Souffle igné", "Flamme vive"],
    // % des dégâts de base infligés à chaque tour de brûlure
    base: 18,
    parEtoile: 9,
    duree: 3,
    poids: 14,
  },
  {
    effect: SpellEffect.DEGATS_ZONE,
    type: SpellType.ACTIF,
    element: SpellElement.FOUDRE,
    noms: ["Arc électrique", "Fracas d'orage", "Chaîne de foudre", "Éclair"],
    // % des dégâts de base, appliqué à chaque ennemi vivant
    base: 45,
    parEtoile: 7,
    poids: 10,
  },
  {
    effect: SpellEffect.RALENTISSEMENT,
    type: SpellType.ACTIF,
    element: SpellElement.GLACE,
    noms: ["Étreinte glacée", "Givre mordant", "Souffle polaire", "Engourdis"],
    // % de vitesse en moins pendant la durée (plafonné à 60 par le moteur)
    base: 30,
    parEtoile: 8,
    duree: 4,
    poids: 12,
  },
  {
    effect: SpellEffect.ETOURDISSEMENT,
    type: SpellType.ACTIF,
    element: SpellElement.GLACE,
    noms: ["Choc paralysant", "Onde de stase", "Cri assourdissant"],
    // Nombre de tours sautés : 1 aux basses raretés, 3 au sommet. La montée
    // est lente pour éviter l'enchaînement d'étourdissements.
    base: 1,
    parEtoile: 0.4,
    poids: 8,
  },
  {
    effect: SpellEffect.SOIN,
    type: SpellType.ACTIF,
    element: SpellElement.NEUTRE,
    noms: ["Chant de vie", "Bénédiction", "Rosée curative", "Second souffle"],
    // % des PV max rendus
    base: 22,
    parEtoile: 7,
    poids: 14,
  },

  // --------------------------------------------------------------- Passifs
  {
    effect: SpellEffect.BONUS_STAT,
    type: SpellType.PASSIF,
    element: SpellElement.NEUTRE,
    noms: [], // les noms dépendent de la statistique visée
    base: 0,
    parEtoile: 0,
    poids: 20,
  },
  {
    effect: SpellEffect.REDUCTION_DEGATS,
    type: SpellType.PASSIF,
    element: SpellElement.NEUTRE,
    noms: ["Carapace runique", "Bouclier spectral", "Peau de pierre"],
    // % de dégâts subis en moins
    base: 6,
    parEtoile: 3,
    poids: 16,
  },
  {
    effect: SpellEffect.REGENERATION,
    type: SpellType.PASSIF,
    element: SpellElement.NEUTRE,
    noms: ["Sève éternelle", "Souffle vital", "Renouveau"],
    // % des PV max rendus à chaque tour
    base: 1,
    parEtoile: 0.4,
    poids: 14,
  },
  {
    effect: SpellEffect.VOL_DE_VIE,
    type: SpellType.PASSIF,
    element: SpellElement.FEU,
    noms: ["Soif ardente", "Morsure vampirique", "Appétit cendré"],
    // % des dégâts infligés convertis en PV
    base: 8,
    parEtoile: 4,
    poids: 13,
  },
  {
    effect: SpellEffect.EPINES,
    type: SpellType.PASSIF,
    element: SpellElement.GLACE,
    noms: ["Ronces de givre", "Carapace d'épines", "Riposte cristalline"],
    // % des dégâts subis renvoyés à l'attaquant
    base: 6,
    parEtoile: 3,
    poids: 12,
  },
  {
    effect: SpellEffect.CRITIQUE,
    type: SpellType.PASSIF,
    element: SpellElement.FOUDRE,
    noms: ["Œil du prédateur", "Instinct meurtrier", "Précision fatale"],
    // % de chance de doubler les dégâts
    base: 8,
    parEtoile: 4,
    poids: 12,
  },
];

export const NOMS_BONUS_STAT: Record<StatType, string[]> = {
  FORCE: ["Rage intérieure", "Fureur latente"],
  VITESSE: ["Réflexes aiguisés", "Foulée légère"],
  RESISTANCE: ["Endurance de fer", "Volonté inébranlable"],
  AGILITE: ["Instinct félin", "Grâce innée"],
};

const STATS: StatType[] = [
  StatType.FORCE,
  StatType.VITESSE,
  StatType.RESISTANCE,
  StatType.AGILITE,
];

export const LIBELLE_ELEMENT: Record<SpellElement, string> = {
  NEUTRE: "Neutre",
  FEU: "Feu",
  GLACE: "Glace",
  FOUDRE: "Foudre",
};

export const COULEUR_ELEMENT: Record<SpellElement, string> = {
  NEUTRE: "#9db8b1",
  FEU: "#f97316",
  GLACE: "#7dd3fc",
  FOUDRE: "#facc15",
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickPondere(defs: DefinitionSort[]): DefinitionSort {
  const total = defs.reduce((somme, d) => somme + d.poids, 0);
  let tirage = Math.random() * total;
  for (const d of defs) {
    if (tirage < d.poids) return d;
    tirage -= d.poids;
  }
  return defs[defs.length - 1];
}

// Plus la rareté est élevée, plus le sort actif revient vite.
function cooldownParRarete(stars: number, effect: SpellEffect): number {
  const base = Math.max(2, 8 - stars);
  // Les effets qui touchent toute l'équipe ou immobilisent restent plus rares,
  // sinon ils écrasent tout le reste dès qu'ils sont disponibles.
  if (effect === SpellEffect.DEGATS_ZONE) return base + 2;
  return base;
}

function manaCoutParRarete(stars: number, effect: SpellEffect): number {
  // Un sort doit coûter une vraie part de la réserve : sinon lancer est
  // toujours préférable à frapper, et les statistiques ne servent plus à rien.
  const base = 18 + (stars - 1) * 6;
  if (effect === SpellEffect.DEGATS_ZONE) return Math.round(base * 1.5);
  if (effect === SpellEffect.ETOURDISSEMENT) return Math.round(base * 1.3);
  return base;
}

export function descriptionSort(s: {
  effect: string;
  value: number;
  targetStat: string | null;
  manaCost?: number;
  duree?: number;
}) {
  const cout = s.manaCost ? ` · ${s.manaCost} mana` : "";
  const tours = s.duree ? ` sur ${s.duree} tours` : "";

  switch (s.effect) {
    case "DEGATS":
      return `+${s.value}% dégâts${cout}`;
    case "BRULURE":
      return `Brûlure ${s.value}%/tour${tours}${cout}`;
    case "DEGATS_ZONE":
      return `${s.value}% dégâts à tous les ennemis${cout}`;
    case "RALENTISSEMENT":
      return `-${s.value}% vitesse${tours}${cout}`;
    case "SOIN":
      return `Soigne ${s.value}% PV${cout}`;
    case "ETOURDISSEMENT":
      return `Étourdit ${s.value} tour(s)${cout}`;
    case "REDUCTION_DEGATS":
      return `-${s.value}% dégâts subis`;
    case "REGENERATION":
      return `+${s.value}% PV par tour`;
    case "VOL_DE_VIE":
      return `${s.value}% des dégâts rendus en PV`;
    case "EPINES":
      return `Renvoie ${s.value}% des dégâts subis`;
    case "CRITIQUE":
      return `${s.value}% de coup critique`;
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
  element: SpellElement;
  value: number;
  duree: number;
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
  const actif = Math.random() < 0.7;
  const candidats = CATALOGUE_SORTS.filter((d) =>
    actif ? d.type === SpellType.ACTIF : d.type === SpellType.PASSIF,
  );
  const def = pickPondere(candidats);

  const cooldown = cooldownParRarete(rarete.stars, def.effect);
  const manaCost =
    def.type === SpellType.ACTIF
      ? manaCoutParRarete(rarete.stars, def.effect)
      : 0;

  // Le bonus de statistique est le seul effet dont la valeur suit la plage de
  // la rareté plutôt qu'une progression propre : il s'ajoute à une stat brute.
  if (def.effect === SpellEffect.BONUS_STAT) {
    const stat = pick(STATS);
    return {
      name: pick(NOMS_BONUS_STAT[stat]),
      type: def.type,
      effect: def.effect,
      element: def.element,
      value:
        Math.floor(Math.random() * (rarete.statMax - rarete.statMin + 1)) +
        rarete.statMin,
      duree: 0,
      targetStat: stat,
      cooldown,
      manaCost,
      rarityId: rarete.id,
    };
  }

  return {
    name: pick(def.noms),
    type: def.type,
    effect: def.effect,
    element: def.element,
    value: Math.round(def.base + (rarete.stars - 1) * def.parEtoile),
    duree: def.duree ?? 0,
    targetStat: null,
    cooldown,
    manaCost,
    rarityId: rarete.id,
  };
}

/** Noms de tous les sorts possibles, pour l'affichage des filtres. */
export const NOMS_SORT: Record<string, string[]> = Object.fromEntries(
  CATALOGUE_SORTS.filter((d) => d.noms.length > 0).map((d) => [
    d.effect,
    d.noms,
  ]),
);
