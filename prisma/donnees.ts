import { VIE_PAR_POINT } from "../src/lib/statsConstantes";

/**
 * Données de référence du jeu : raretés et monstres.
 *
 * Les monstres ne sont pas écrits à la main palier par palier. Ils sont
 * dérivés d'une statistique de référence — celle qu'un joueur est censé
 * atteindre quand il arrive à ce palier — pondérée par le tempérament de
 * chaque famille. Trente blocs de chiffres recopiés seraient impossibles à
 * réajuster ensuite sans en oublier un.
 *
 * Pour mesurer l'effet d'un réglage : `npx tsx scripts/equilibrage.ts`.
 */

export const RARETES = [
  { stars: 1, statMin: 0, statMax: 5, dropRate: 40 },
  { stars: 2, statMin: 3, statMax: 10, dropRate: 30 },
  { stars: 3, statMin: 8, statMax: 15, dropRate: 20 },
  { stars: 4, statMin: 13, statMax: 20, dropRate: 7 },
  { stars: 5, statMin: 18, statMax: 25, dropRate: 2.5 },
  { stars: 6, statMin: 23, statMax: 30, dropRate: 0.5 },
];

/**
 * Statistique d'un personnage censé aborder ce palier : moyenne de la rareté
 * correspondante, portée à son niveau maximum.
 *
 *   palier 1 -> 1★ niveau 10, palier 2 -> 2★ niveau 20, etc.
 *
 * Le boss affronte trois personnages de ce calibre.
 */
export const REFERENCE_JOUEUR: Record<number, number> = {
  1: 12,
  2: 26,
  3: 40,
  4: 56,
  5: 70,
};

type Famille = {
  baseName: string;
  /** Multiplicateurs appliqués à la statistique de référence du palier. */
  force: number;
  vitesse: number;
  resistance: number;
  agilite: number;
  /** Multiplicateur de PV, appliqué en plus du calibre de l'équipe. */
  vie: number;
  /** Modulation des récompenses : un monstre pénible paie mieux. */
  or: number;
  xp: number;
};

/**
 * Tempérament des familles.
 *
 * Les coefficients se compensent volontairement : ce qui est gagné en vitesse
 * ou en dégâts est perdu en résistance ou en PV, pour que deux familles du
 * même palier restent d'une difficulté comparable tout en se jouant
 * différemment.
 */
const FAMILLES: Famille[] = [
  // Rapide et mordant, mais s'écroule vite.
  {
    baseName: "Loup",
    force: 1.15,
    vitesse: 1.25,
    resistance: 0.6,
    agilite: 0.9,
    vie: 0.85,
    or: 1,
    xp: 1,
  },
  // Lourd : frappe fort, encaisse, mais joue rarement.
  {
    baseName: "Ours",
    force: 1.3,
    vitesse: 0.6,
    resistance: 1.0,
    agilite: 0.45,
    vie: 1.25,
    or: 1,
    xp: 1,
  },
  // Sac à PV inoffensif : la source d'expérience du jeu.
  {
    baseName: "Slime",
    force: 0.65,
    vitesse: 0.7,
    resistance: 0.9,
    agilite: 0.4,
    vie: 1.5,
    or: 0.85,
    xp: 2.2,
  },
  // Généraliste sans défaut marqué ; donne les essences élémentaires.
  {
    baseName: "Élémentaire",
    force: 1.0,
    vitesse: 1.0,
    resistance: 0.85,
    agilite: 0.85,
    vie: 1.0,
    or: 1,
    xp: 1.1,
  },
  // Très rapide et insaisissable : beaucoup d'esquives.
  {
    baseName: "Griffon",
    force: 1.05,
    vitesse: 1.4,
    resistance: 0.55,
    agilite: 1.35,
    vie: 0.8,
    or: 1.15,
    xp: 1.1,
  },
  // Mur : peu de dégâts passent, mais il en inflige peu aussi.
  {
    baseName: "Serpent de Cristal",
    force: 0.95,
    vitesse: 0.75,
    resistance: 1.12,
    agilite: 0.6,
    vie: 1.15,
    or: 1.15,
    xp: 1.1,
  },
];

const CHIFFRES_ROMAINS = ["I", "II", "III", "IV", "V"];

/** Nombre de personnages que le boss affronte : il doit tenir face à eux. */
const TAILLE_EQUIPE = 3;

/**
 * Fraction des PV de l'équipe adverse que représente le boss.
 *
 * En dessous de 1, le boss meurt avant d'avoir pu jouer assez de fois pour
 * menacer ; trop au-dessus, le combat s'éternise. C'est le premier bouton à
 * tourner pour rendre l'aventure plus ou moins dure.
 */
const ROBUSTESSE_BOSS = 1.0;

function statsMonstre(famille: Famille, tier: number) {
  const reference = REFERENCE_JOUEUR[tier];
  const r = (coefficient: number) =>
    Math.max(1, Math.round(reference * coefficient));

  return {
    baseName: famille.baseName,
    tier,
    name: `${famille.baseName} ${CHIFFRES_ROMAINS[tier - 1]}`,
    vie: Math.round(
      reference * VIE_PAR_POINT * TAILLE_EQUIPE * ROBUSTESSE_BOSS * famille.vie,
    ),
    force: r(famille.force),
    vitesse: r(famille.vitesse),
    resistance: r(famille.resistance),
    agilite: r(famille.agilite),
    gainVictoire: Math.round(30 * Math.pow(1.42, tier - 1) * famille.or),
    gainDefaite: Math.round(10 * Math.pow(1.42, tier - 1) * famille.or),
    xpGain: Math.round(20 * (1 + 0.35 * (tier - 1)) * famille.xp),
  };
}

export const MONSTRES = FAMILLES.flatMap((famille) =>
  [1, 2, 3, 4, 5].map((tier) => statsMonstre(famille, tier)),
);
