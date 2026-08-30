import { creerRng } from "./rng";

export type PersonnageCombat3v3 = {
  id: string;
  name: string;
  vie: number;
  force: number;
  vitesse: number;
  resistance: number;
  agilite: number;
};

export type CombatEvent3v3 =
  | { type: "dodge"; attackerId: string; defenderId: string }
  | {
      type: "hit";
      attackerId: string;
      defenderId: string;
      damage: number;
      defenderHpAfter: number;
    }
  | { type: "ko"; personnageId: string };

const BASE_TICK = 100;
const FACTEUR_REDUCTION = 0.5;
const ESQUIVE_MIN = 5;
const ESQUIVE_MAX = 60;
const MAX_TOURS = 400;

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

export function simulerCombatEquipe(
  equipeA: [PersonnageCombat3v3, PersonnageCombat3v3, PersonnageCombat3v3],
  equipeB: [PersonnageCombat3v3, PersonnageCombat3v3, PersonnageCombat3v3],
  seed: number,
) {
  const random = creerRng(seed);
  const tous = [...equipeA, ...equipeB];

  const pv: Record<string, number> = {};
  const compteur: Record<string, number> = {};
  const intervalle: Record<string, number> = {};
  const parId: Record<string, PersonnageCombat3v3> = {};
  const camp: Record<string, "A" | "B"> = {};

  for (const p of equipeA) {
    pv[p.id] = p.vie;
    compteur[p.id] = 0;
    intervalle[p.id] = BASE_TICK / p.vitesse;
    parId[p.id] = p;
    camp[p.id] = "A";
  }
  for (const p of equipeB) {
    pv[p.id] = p.vie;
    compteur[p.id] = 0;
    intervalle[p.id] = BASE_TICK / p.vitesse;
    parId[p.id] = p;
    camp[p.id] = "B";
  }

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

    const campAdverse = camp[attaquant.id] === "A" ? "B" : "A";
    const pool = vivants(campAdverse);
    if (pool.length === 0) break;
    const defenseur = pool[Math.floor(random() * pool.length)];

    const chance = chanceEsquive(defenseur.agilite, attaquant.force);
    const jet = random() * 100;

    if (jet < chance) {
      events.push({
        type: "dodge",
        attackerId: attaquant.id,
        defenderId: defenseur.id,
      });
    } else {
      const degats = calculerDegats(attaquant.force, defenseur.resistance);
      pv[defenseur.id] = Math.max(0, pv[defenseur.id] - degats);
      events.push({
        type: "hit",
        attackerId: attaquant.id,
        defenderId: defenseur.id,
        damage: degats,
        defenderHpAfter: pv[defenseur.id],
      });
      if (pv[defenseur.id] === 0) {
        events.push({ type: "ko", personnageId: defenseur.id });
      }
    }

    compteur[attaquant.id] += intervalle[attaquant.id];
  }

  const winnerSide: "A" | "B" = vivants("A").length > 0 ? "A" : "B";
  return { events, winnerSide };
}
