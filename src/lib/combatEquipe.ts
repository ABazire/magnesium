import { creerRng } from "./rng";
import type { SortActifCombat } from "./personnage";

export type PersonnageCombat3v3 = {
  id: string;
  name: string;
  vie: number;
  force: number;
  vitesse: number;
  resistance: number;
  agilite: number;
  manaMax?: number;
  sortsActifs?: SortActifCombat[];
  reductionDegats?: number;
};

export type CombatEvent3v3 =
  | { type: "dodge"; attackerId: string; defenderId: string; manaApres: number }
  | {
      type: "hit";
      attackerId: string;
      defenderId: string;
      damage: number;
      defenderHpAfter: number;
      manaApres: number;
    }
  | { type: "ko"; personnageId: string }
  | {
      type: "spellDegats";
      attackerId: string;
      defenderId: string;
      spellName: string;
      damage: number;
      defenderHpAfter: number;
      manaApres: number;
    }
  | {
      type: "spellSoin";
      casterId: string;
      spellName: string;
      heal: number;
      casterHpAfter: number;
      manaApres: number;
    }
  | {
      type: "spellEtourdissement";
      casterId: string;
      targetId: string;
      spellName: string;
      tours: number;
      manaApres: number;
    }
  | {
      type: "stun";
      personnageId: string;
      toursRestants: number;
      manaApres: number;
    };

const BASE_TICK = 100;
const FACTEUR_REDUCTION = 0.5;
const ESQUIVE_MIN = 5;
const ESQUIVE_MAX = 60;
const MAX_TOURS = 400;
const REGEN_MANA_PAR_TOUR = 15;

function chanceEsquive(
  agiliteDefenseur: number,
  forceAttaquant: number,
): number {
  const brut = (agiliteDefenseur / (agiliteDefenseur + forceAttaquant)) * 100;
  return Math.min(ESQUIVE_MAX, Math.max(ESQUIVE_MIN, brut));
}

function calculerDegats(
  forceAttaquant: number,
  resistanceDefenseur: number,
): number {
  return Math.max(
    1,
    Math.round(forceAttaquant - resistanceDefenseur * FACTEUR_REDUCTION),
  );
}

function appliquerReductionDegats(degats: number, reductionPct: number): number {
  if (reductionPct <= 0) return degats;
  return Math.max(1, Math.round(degats * (1 - reductionPct / 100)));
}

// Accepte des tableaux (pas seulement des équipes de 3) pour pouvoir aussi
// servir aux combats d'aventure en équipe (3 personnages contre 1 monstre).
export function simulerCombatEquipe(
  equipeA: PersonnageCombat3v3[],
  equipeB: PersonnageCombat3v3[],
  seed: number,
) {
  const random = creerRng(seed);
  const tous = [...equipeA, ...equipeB];

  const pv: Record<string, number> = {};
  const compteur: Record<string, number> = {};
  const intervalle: Record<string, number> = {};
  const parId: Record<string, PersonnageCombat3v3> = {};
  const camp: Record<string, "A" | "B"> = {};
  const stun: Record<string, number> = {};
  const cooldowns: Record<string, Record<string, number>> = {};
  const mana: Record<string, number> = {};

  for (const p of tous) {
    pv[p.id] = p.vie;
    compteur[p.id] = 0;
    intervalle[p.id] = BASE_TICK / p.vitesse;
    parId[p.id] = p;
    stun[p.id] = 0;
    cooldowns[p.id] = Object.fromEntries(
      (p.sortsActifs ?? []).map((s) => [s.id, 0]),
    );
    mana[p.id] = p.manaMax ?? 0;
  }
  for (const p of equipeA) camp[p.id] = "A";
  for (const p of equipeB) camp[p.id] = "B";

  function vivants(c: "A" | "B") {
    return tous.filter((p) => camp[p.id] === c && pv[p.id] > 0);
  }

  const events: CombatEvent3v3[] = [];
  let tours = 0;

  while (
    vivants("A").length > 0 &&
    vivants("B").length > 0 &&
    tours < MAX_TOURS
  ) {
    tours++;

    const enVie = tous.filter((p) => pv[p.id] > 0);
    enVie.sort((a, b) => compteur[a.id] - compteur[b.id]);
    const attaquant = enVie[0];

    mana[attaquant.id] = Math.min(
      attaquant.manaMax ?? 0,
      mana[attaquant.id] + REGEN_MANA_PAR_TOUR,
    );

    if (stun[attaquant.id] > 0) {
      stun[attaquant.id] -= 1;
      events.push({
        type: "stun",
        personnageId: attaquant.id,
        toursRestants: stun[attaquant.id],
        manaApres: mana[attaquant.id],
      });
      compteur[attaquant.id] += intervalle[attaquant.id];
      continue;
    }

    const campAdverse = camp[attaquant.id] === "A" ? "B" : "A";
    const pool = vivants(campAdverse);
    if (pool.length === 0) break;
    const defenseur = pool[Math.floor(random() * pool.length)];

    for (const sort of attaquant.sortsActifs ?? []) {
      if (cooldowns[attaquant.id][sort.id] > 0) {
        cooldowns[attaquant.id][sort.id] -= 1;
      }
    }

    const sortPret = (attaquant.sortsActifs ?? []).find(
      (s) =>
        cooldowns[attaquant.id][s.id] === 0 && mana[attaquant.id] >= s.manaCost,
    );

    if (sortPret) {
      cooldowns[attaquant.id][sortPret.id] = sortPret.cooldown;
      mana[attaquant.id] -= sortPret.manaCost;

      if (sortPret.effect === "DEGATS") {
        const base = calculerDegats(attaquant.force, defenseur.resistance);
        const bonus = Math.round(base * (sortPret.value / 100));
        const degats = appliquerReductionDegats(
          base + bonus,
          defenseur.reductionDegats ?? 0,
        );
        pv[defenseur.id] = Math.max(0, pv[defenseur.id] - degats);
        events.push({
          type: "spellDegats",
          attackerId: attaquant.id,
          defenderId: defenseur.id,
          spellName: sortPret.name,
          damage: degats,
          defenderHpAfter: pv[defenseur.id],
          manaApres: mana[attaquant.id],
        });
        if (pv[defenseur.id] === 0) {
          events.push({ type: "ko", personnageId: defenseur.id });
        }
      } else if (sortPret.effect === "SOIN") {
        // v1 : le soin ne cible que le lanceur, pas d'assistance aux alliés
        const heal = Math.round(attaquant.vie * (sortPret.value / 100));
        pv[attaquant.id] = Math.min(attaquant.vie, pv[attaquant.id] + heal);
        events.push({
          type: "spellSoin",
          casterId: attaquant.id,
          spellName: sortPret.name,
          heal,
          casterHpAfter: pv[attaquant.id],
          manaApres: mana[attaquant.id],
        });
      } else {
        stun[defenseur.id] = (stun[defenseur.id] ?? 0) + sortPret.value;
        events.push({
          type: "spellEtourdissement",
          casterId: attaquant.id,
          targetId: defenseur.id,
          spellName: sortPret.name,
          tours: sortPret.value,
          manaApres: mana[attaquant.id],
        });
      }
    } else {
      const chance = chanceEsquive(defenseur.agilite, attaquant.force);
      const jet = random() * 100;

      if (jet < chance) {
        events.push({
          type: "dodge",
          attackerId: attaquant.id,
          defenderId: defenseur.id,
          manaApres: mana[attaquant.id],
        });
      } else {
        const base = calculerDegats(attaquant.force, defenseur.resistance);
        const degats = appliquerReductionDegats(
          base,
          defenseur.reductionDegats ?? 0,
        );
        pv[defenseur.id] = Math.max(0, pv[defenseur.id] - degats);
        events.push({
          type: "hit",
          attackerId: attaquant.id,
          defenderId: defenseur.id,
          damage: degats,
          defenderHpAfter: pv[defenseur.id],
          manaApres: mana[attaquant.id],
        });
        if (pv[defenseur.id] === 0) {
          events.push({ type: "ko", personnageId: defenseur.id });
        }
      }
    }

    compteur[attaquant.id] += intervalle[attaquant.id];
  }

  const winnerSide: "A" | "B" = vivants("A").length > 0 ? "A" : "B";
  return { events, winnerSide };
}
