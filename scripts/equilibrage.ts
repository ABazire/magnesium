/**
 * Banc d'essai d'équilibrage.
 *
 * Fait tourner le vrai moteur de combat (pas une approximation) sur des
 * équipes types, face à chaque palier de chaque monstre et en duel d'équipes.
 * Sert à mesurer l'effet d'un réglage plutôt qu'à le deviner.
 *
 *   npx tsx scripts/equilibrage.ts
 *
 * Les boutons à tourner sont VIE_PAR_POINT (src/lib/statsConstantes.ts),
 * ROBUSTESSE_BOSS et les coefficients de familles (prisma/donnees.ts).
 */

import { simulerCombatEquipe } from "../src/lib/combatEquipe";
import type { PersonnageCombat3v3 } from "../src/lib/combatEquipe";
import { bonusStatsParNiveau, niveauMax } from "../src/lib/leveling";
import { MONSTRES, RARETES } from "../prisma/donnees";
import { VIE_PAR_POINT, MANA_BASE } from "../src/lib/statsConstantes";

const PARTIES = 400;

function personnageType(
  stars: number,
  level: number,
  index: number,
  camp = "A",
): PersonnageCombat3v3 {
  const rarete = RARETES.find((r) => r.stars === stars)!;
  const base = Math.round((rarete.statMin + rarete.statMax) / 2);
  const bonus = bonusStatsParNiveau(level);

  return {
    // Le camp entre dans l'identifiant : le moteur indexe ses tables par id,
    // deux équipes identiques se marcheraient sinon dessus.
    id: `${camp}-p${stars}-${index}`,
    name: `${stars}★ nv${level}`,
    vie: (base + bonus) * VIE_PAR_POINT,
    force: base + bonus,
    vitesse: base + bonus,
    resistance: base + bonus,
    agilite: base + bonus,
    manaMax: MANA_BASE + base + bonus,
    sortsActifs: [],
  };
}

function equipeType(stars: number, level: number, camp = "A") {
  return [0, 1, 2].map((i) => personnageType(stars, level, i, camp));
}

function monstreCombat(m: (typeof MONSTRES)[number]): PersonnageCombat3v3 {
  return {
    id: `m-${m.name}`,
    name: m.name,
    vie: m.vie,
    force: m.force,
    vitesse: m.vitesse,
    resistance: m.resistance,
    agilite: m.agilite,
  };
}

function mesurer(
  equipe: PersonnageCombat3v3[],
  adverse: PersonnageCombat3v3[],
) {
  let victoires = 0;
  let actions = 0;

  for (let i = 0; i < PARTIES; i++) {
    const { events, winnerSide } = simulerCombatEquipe(
      equipe.map((p) => ({ ...p })),
      adverse.map((p) => ({ ...p })),
      i * 7919 + 13,
    );
    if (winnerSide === "A") victoires += 1;
    actions += events.length;
  }

  return { taux: (victoires / PARTIES) * 100, actions: actions / PARTIES };
}

/**
 * Niveau à partir duquel une rareté franchit un seuil de victoire.
 * C'est la vraie courbe de progression : au sein d'une rareté, c'est le
 * niveau qui fait avancer le joueur, pas le passage à la rareté suivante.
 */
function niveauRequis(
  stars: number,
  monstre: (typeof MONSTRES)[number],
  seuil: number,
): number | null {
  const max = niveauMax(stars);
  const atteint = (level: number) =>
    mesurer(equipeType(stars, level), [monstreCombat(monstre)]).taux >= seuil;

  if (!atteint(max)) return null;

  // Le taux de victoire croît avec le niveau : une recherche dichotomique
  // suffit, et évite de simuler chaque niveau un par un.
  let bas = 1;
  let haut = max;
  while (bas < haut) {
    const milieu = Math.floor((bas + haut) / 2);
    if (atteint(milieu)) haut = milieu;
    else bas = milieu + 1;
  }
  return bas;
}

const familles = [...new Set(MONSTRES.map((m) => m.baseName))];

console.log("=== AVENTURE : niveau requis pour 50% / 90% de victoires ===");
console.log("(rareté attendue au palier : 1★->T1, 2★->T2, ... ; max = ★x10)\n");

for (const famille of familles) {
  console.log(`-- ${famille}`);
  for (let tier = 1; tier <= 5; tier++) {
    const m = MONSTRES.find((x) => x.baseName === famille && x.tier === tier)!;
    const attendue = tier;
    const cellules: string[] = [];

    for (const stars of [attendue, attendue + 1]) {
      if (stars > 6) continue;
      const n50 = niveauRequis(stars, m, 50);
      const n90 = niveauRequis(stars, m, 90);
      const max = niveauMax(stars);
      cellules.push(
        `${stars}★ : ${n50 ? `nv${n50}` : "jamais"} / ${n90 ? `nv${n90}` : "jamais"} (max ${max})`,
      );
    }

    const { actions } = mesurer(equipeType(attendue, niveauMax(attendue)), [
      monstreCombat(m),
    ]);
    console.log(
      `  T${tier}  ${cellules.join("   ")}   · ${actions.toFixed(0)} actions`,
    );
  }
  console.log();
}

console.log("=== 3v3 : miroir, et écart de niveau ===\n");
for (const stars of [1, 2, 3, 4, 5, 6]) {
  const max = niveauMax(stars);
  const equipe = equipeType(stars, max);
  const miroir = mesurer(equipe, equipeType(stars, max, "B"));

  // Un écart de 10% de niveau doit se voir sans être rédhibitoire.
  const plusFaible = Math.max(1, Math.round(max * 0.9));
  const contreFaible = mesurer(equipe, equipeType(stars, plusFaible, "B")).taux;
  const rareteSup =
    stars < 6 ? mesurer(equipe, equipeType(stars + 1, niveauMax(stars + 1), "B")).taux : null;

  console.log(
    `${stars}★nv${max} : miroir ${miroir.taux.toFixed(0)}% (${miroir.actions.toFixed(0)} actions)` +
      ` · contre nv${plusFaible} ${contreFaible.toFixed(0)}%` +
      (rareteSup === null ? "" : ` · contre ${stars + 1}★ max ${rareteSup.toFixed(0)}%`),
  );
}

/* ==========================================================================
   Apport des sorts
   Une équipe équipée doit battre la même équipe nue, sans pour autant rendre
   les statistiques de base sans objet. On vise un avantage marqué mais pas
   écrasant : autour de 70 à 85%.
   ========================================================================== */

import { CATALOGUE_SORTS } from "../src/lib/spell";
import type { SortActifCombat, PassifsCombat } from "../src/lib/personnage";

function valeurSort(effect: string, stars: number): number {
  const def = CATALOGUE_SORTS.find((d) => d.effect === effect)!;
  return Math.round(def.base + (stars - 1) * def.parEtoile);
}

function sortDe(
  effect: SortActifCombat["effect"],
  stars: number,
  index: number,
): SortActifCombat {
  const def = CATALOGUE_SORTS.find((d) => d.effect === effect)!;
  return {
    id: `s${index}-${effect}`,
    name: effect,
    effect,
    element: def.element as SortActifCombat["element"],
    value: valeurSort(effect, stars),
    duree: def.duree ?? 0,
    cooldown: Math.max(2, 8 - stars) + (effect === "DEGATS_ZONE" ? 2 : 0),
    manaCost: 18 + (stars - 1) * 6,
  };
}

function equipeEquipee(
  stars: number,
  level: number,
  actifs: SortActifCombat["effect"][],
  passif: keyof PassifsCombat | null,
  effetPassif: string | null,
  camp = "A",
) {
  return equipeType(stars, level, camp).map((p, i) => ({
    ...p,
    sortsActifs: actifs.map((e, j) => sortDe(e, stars, i * 10 + j)),
    passifs:
      passif && effetPassif
        ? {
            reductionDegats: 0,
            regeneration: 0,
            volDeVie: 0,
            epines: 0,
            critique: 0,
            [passif]: valeurSort(effetPassif, stars),
          }
        : undefined,
  }));
}

console.log("\n=== APPORT DES SORTS (3v3, équipe équipée contre équipe nue) ===\n");

const STARS_TEST = 4;
const NIVEAU_TEST = niveauMax(STARS_TEST);

const jeux: [string, SortActifCombat["effect"][], keyof PassifsCombat | null, string | null][] = [
  ["dégâts seuls", ["DEGATS", "DEGATS", "DEGATS"], null, null],
  ["feu (brûlure)", ["BRULURE", "BRULURE", "BRULURE"], null, null],
  ["foudre (zone)", ["DEGATS_ZONE", "DEGATS_ZONE", "DEGATS_ZONE"], null, null],
  ["glace (ralentir)", ["RALENTISSEMENT", "DEGATS", "DEGATS"], null, null],
  ["étourdissement", ["ETOURDISSEMENT", "DEGATS", "DEGATS"], null, null],
  ["soin", ["SOIN", "DEGATS", "DEGATS"], null, null],
  ["passif réduction", [], "reductionDegats", "REDUCTION_DEGATS"],
  ["passif régénération", [], "regeneration", "REGENERATION"],
  ["passif vol de vie", [], "volDeVie", "VOL_DE_VIE"],
  ["passif épines", [], "epines", "EPINES"],
  ["passif critique", [], "critique", "CRITIQUE"],
];

for (const [libelle, actifs, passif, effetPassif] of jeux) {
  const equipee = equipeEquipee(
    STARS_TEST,
    NIVEAU_TEST,
    actifs,
    passif,
    effetPassif,
  );
  const { taux, actions } = mesurer(
    equipee,
    equipeType(STARS_TEST, NIVEAU_TEST, "B"),
  );
  console.log(
    `${libelle.padEnd(22)} ${taux.toFixed(0).padStart(3)}%  (${actions.toFixed(0)} actions)`,
  );
}
