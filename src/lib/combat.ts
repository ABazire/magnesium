import { creerRng } from "./rng";
import type { SortActifCombat } from "./personnage";

export type { SortActifCombat };

export type PersonnageCombat = {
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

export type CombatEvent =
  | { type: "dodge"; attackerId: string; defenderId: string; manaApres: number }
  | {
      type: "hit";
      attackerId: string;
      defenderId: string;
      damage: number;
      defenderHpAfter: number;
      manaApres: number;
    }
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
const MAX_TOURS = 200;
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
  const degats = forceAttaquant - resistanceDefenseur * FACTEUR_REDUCTION;
  return Math.max(1, Math.round(degats));
}

function appliquerReductionDegats(degats: number, reductionPct: number): number {
  if (reductionPct <= 0) return degats;
  return Math.max(1, Math.round(degats * (1 - reductionPct / 100)));
}

export function simulerCombat(
  perso1: PersonnageCombat,
  perso2: PersonnageCombat,
  seed: number,
) {
  const random = creerRng(seed);

  const pv: Record<string, number> = {
    [perso1.id]: perso1.vie,
    [perso2.id]: perso2.vie,
  };
  const compteur: Record<string, number> = { [perso1.id]: 0, [perso2.id]: 0 };
  const intervalle: Record<string, number> = {
    [perso1.id]: BASE_TICK / perso1.vitesse,
    [perso2.id]: BASE_TICK / perso2.vitesse,
  };
  const parId: Record<string, PersonnageCombat> = {
    [perso1.id]: perso1,
    [perso2.id]: perso2,
  };
  const stun: Record<string, number> = { [perso1.id]: 0, [perso2.id]: 0 };
  const cooldowns: Record<string, Record<string, number>> = {
    [perso1.id]: Object.fromEntries(
      (perso1.sortsActifs ?? []).map((s) => [s.id, 0]),
    ),
    [perso2.id]: Object.fromEntries(
      (perso2.sortsActifs ?? []).map((s) => [s.id, 0]),
    ),
  };
  const mana: Record<string, number> = {
    [perso1.id]: perso1.manaMax ?? 0,
    [perso2.id]: perso2.manaMax ?? 0,
  };

  const events: CombatEvent[] = [];
  let tours = 0;

  while (pv[perso1.id] > 0 && pv[perso2.id] > 0 && tours < MAX_TOURS) {
    tours++;

    const attaquantId =
      compteur[perso1.id] <= compteur[perso2.id] ? perso1.id : perso2.id;
    const defenseurId = attaquantId === perso1.id ? perso2.id : perso1.id;
    const attaquant = parId[attaquantId];
    const defenseur = parId[defenseurId];

    mana[attaquantId] = Math.min(
      attaquant.manaMax ?? 0,
      mana[attaquantId] + REGEN_MANA_PAR_TOUR,
    );

    if (stun[attaquantId] > 0) {
      stun[attaquantId] -= 1;
      events.push({
        type: "stun",
        personnageId: attaquantId,
        toursRestants: stun[attaquantId],
        manaApres: mana[attaquantId],
      });
      compteur[attaquantId] += intervalle[attaquantId];
      continue;
    }

    for (const sort of attaquant.sortsActifs ?? []) {
      if (cooldowns[attaquantId][sort.id] > 0) {
        cooldowns[attaquantId][sort.id] -= 1;
      }
    }

    const sortPret = (attaquant.sortsActifs ?? []).find(
      (s) => cooldowns[attaquantId][s.id] === 0 && mana[attaquantId] >= s.manaCost,
    );

    if (sortPret) {
      cooldowns[attaquantId][sortPret.id] = sortPret.cooldown;
      mana[attaquantId] -= sortPret.manaCost;
      const reductionDefenseur = defenseur.reductionDegats ?? 0;

      if (sortPret.effect === "DEGATS") {
        const base = calculerDegats(attaquant.force, defenseur.resistance);
        const bonus = Math.round(base * (sortPret.value / 100));
        const degats = appliquerReductionDegats(base + bonus, reductionDefenseur);
        pv[defenseurId] = Math.max(0, pv[defenseurId] - degats);
        events.push({
          type: "spellDegats",
          attackerId: attaquantId,
          defenderId: defenseurId,
          spellName: sortPret.name,
          damage: degats,
          defenderHpAfter: pv[defenseurId],
          manaApres: mana[attaquantId],
        });
      } else if (sortPret.effect === "SOIN") {
        const heal = Math.round(attaquant.vie * (sortPret.value / 100));
        pv[attaquantId] = Math.min(attaquant.vie, pv[attaquantId] + heal);
        events.push({
          type: "spellSoin",
          casterId: attaquantId,
          spellName: sortPret.name,
          heal,
          casterHpAfter: pv[attaquantId],
          manaApres: mana[attaquantId],
        });
      } else {
        stun[defenseurId] = (stun[defenseurId] ?? 0) + sortPret.value;
        events.push({
          type: "spellEtourdissement",
          casterId: attaquantId,
          targetId: defenseurId,
          spellName: sortPret.name,
          tours: sortPret.value,
          manaApres: mana[attaquantId],
        });
      }
    } else {
      const chance = chanceEsquive(defenseur.agilite, attaquant.force);
      const jet = random() * 100;

      if (jet < chance) {
        events.push({
          type: "dodge",
          attackerId: attaquantId,
          defenderId: defenseurId,
          manaApres: mana[attaquantId],
        });
      } else {
        const base = calculerDegats(attaquant.force, defenseur.resistance);
        const degats = appliquerReductionDegats(
          base,
          defenseur.reductionDegats ?? 0,
        );
        pv[defenseurId] = Math.max(0, pv[defenseurId] - degats);
        events.push({
          type: "hit",
          attackerId: attaquantId,
          defenderId: defenseurId,
          damage: degats,
          defenderHpAfter: pv[defenseurId],
          manaApres: mana[attaquantId],
        });
      }
    }

    compteur[attaquantId] += intervalle[attaquantId];
  }

  const winnerId = pv[perso1.id] > 0 ? perso1.id : perso2.id;

  return { events, winnerId };
}
