import { creerRng } from "./rng";
import type { SortActifCombat, PassifsCombat } from "./personnage";

/**
 * Moteur de combat, commun au 1v1, au 3v3 et à l'aventure.
 *
 * Il n'y a qu'un seul moteur : le 1v1 passe simplement deux camps d'un
 * combattant (voir `combat.ts`). Deux moteurs séparés voudraient dire
 * implémenter chaque effet deux fois, et les voir diverger à la première
 * correction d'équilibrage.
 *
 * Le déroulé est à base de compteurs : chaque combattant avance son compteur
 * de `BASE_TICK / vitesse` après avoir agi, et c'est toujours celui dont le
 * compteur est le plus bas qui joue. Un personnage deux fois plus rapide agit
 * donc deux fois plus souvent.
 */

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
  /** Ancien champ, conservé : équivaut à `passifs.reductionDegats`. */
  reductionDegats?: number;
  passifs?: PassifsCombat;
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
      critique?: boolean;
    }
  | { type: "ko"; personnageId: string }
  | {
      type: "spellDegats";
      attackerId: string;
      defenderId: string;
      spellName: string;
      element?: string;
      damage: number;
      defenderHpAfter: number;
      manaApres: number;
      critique?: boolean;
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
      type: "spellRalentissement";
      casterId: string;
      targetId: string;
      spellName: string;
      pourcentage: number;
      tours: number;
      manaApres: number;
    }
  | {
      type: "brulure";
      personnageId: string;
      damage: number;
      hpAfter: number;
      toursRestants: number;
    }
  | { type: "regeneration"; personnageId: string; heal: number; hpAfter: number }
  | {
      type: "volDeVie";
      personnageId: string;
      heal: number;
      hpAfter: number;
    }
  | {
      type: "epines";
      defenderId: string;
      attackerId: string;
      damage: number;
      attackerHpAfter: number;
    }
  | {
      type: "stun";
      personnageId: string;
      toursRestants: number;
      manaApres: number;
    };

const BASE_TICK = 100;
const FACTEUR_REDUCTION = 0.35;
const ESQUIVE_MIN = 3;
const ESQUIVE_MAX = 40;
/** Poids de la force face à l'agilité dans le calcul d'esquive. */
const POIDS_FORCE_ESQUIVE = 5;
const MAX_TOURS = 600;
/**
 * Régénération de mana, en fraction de la réserve maximale et par tour.
 *
 * C'était une valeur fixe de 15 points : une réserve modeste se remplissait
 * en deux tours et le mana ne limitait rien, si bien que lancer un sort était
 * toujours préférable à frapper. En pourcentage, le coût d'un sort représente
 * le même effort à tous les niveaux.
 */
const REGEN_MANA_PCT = 0.05;

/**
 * Part de la réserve de mana au début du combat.
 *
 * À réserve pleine, chaque combattant enchaînait ses trois sorts dès les
 * premiers tours et le combat était joué avant que le mana ne redevienne une
 * contrainte. En démarrant à moitié, l'ouverture vaut un sort, la suite se
 * mérite.
 */
const MANA_DEPART_PCT = 0.5;
/** Amplitude de l'aléa sur chaque coup, en fraction des dégâts. */
const VARIANCE_DEGATS = 0.15;

/**
 * Chance d'esquive, en pourcentage.
 *
 * À statistiques égales l'ancienne formule donnait 50% : une attaque sur deux
 * dans le vide, et surtout un avantage énorme aux sorts, qui ne sont pas
 * esquivables. Le poids donné à la force ramène ce cas de figure autour de
 * 17%, une valeur qui laisse l'agilité utile sans rendre les coups aléatoires.
 */
function chanceEsquive(
  agiliteDefenseur: number,
  forceAttaquant: number,
): number {
  const brut =
    (agiliteDefenseur /
      (agiliteDefenseur + POIDS_FORCE_ESQUIVE * forceAttaquant)) *
    100;
  return Math.min(ESQUIVE_MAX, Math.max(ESQUIVE_MIN, brut));
}

/**
 * Dégâts bruts d'un coup, avant critique et réductions.
 *
 * L'aléa de ±15% n'est pas cosmétique : sans lui, deux équipes aux
 * statistiques proches donnaient toujours le même vainqueur, et un seul
 * niveau d'écart faisait passer le taux de victoire de 50% à 100%. La
 * variance est ce qui rend la progression graduelle plutôt que binaire.
 */
function degatsDeBase(
  forceAttaquant: number,
  resistanceDefenseur: number,
  random: () => number,
): number {
  const brut = forceAttaquant - resistanceDefenseur * FACTEUR_REDUCTION;
  const facteur = 1 + (random() * 2 - 1) * VARIANCE_DEGATS;
  return Math.max(1, Math.round(brut * facteur));
}

function passifsDe(p: PersonnageCombat3v3): PassifsCombat {
  return {
    reductionDegats: p.passifs?.reductionDegats ?? p.reductionDegats ?? 0,
    regeneration: p.passifs?.regeneration ?? 0,
    volDeVie: p.passifs?.volDeVie ?? 0,
    epines: p.passifs?.epines ?? 0,
    critique: p.passifs?.critique ?? 0,
  };
}

export function simulerCombatEquipe(
  equipeA: PersonnageCombat3v3[],
  equipeB: PersonnageCombat3v3[],
  seed: number,
) {
  const random = creerRng(seed);
  const tous = [...equipeA, ...equipeB];

  const pv: Record<string, number> = {};
  const compteur: Record<string, number> = {};
  const parId: Record<string, PersonnageCombat3v3> = {};
  const passifs: Record<string, PassifsCombat> = {};
  const camp: Record<string, "A" | "B"> = {};
  const stun: Record<string, number> = {};
  const cooldowns: Record<string, Record<string, number>> = {};
  const mana: Record<string, number> = {};
  const initiative: Record<string, number> = {};
  const brulure: Record<string, { degats: number; tours: number }> = {};
  const ralenti: Record<string, { pourcentage: number; tours: number }> = {};

  for (const p of tous) {
    pv[p.id] = p.vie;
    compteur[p.id] = 0;
    parId[p.id] = p;
    passifs[p.id] = passifsDe(p);
    stun[p.id] = 0;
    cooldowns[p.id] = Object.fromEntries(
      (p.sortsActifs ?? []).map((s) => [s.id, 0]),
    );
    mana[p.id] = Math.round((p.manaMax ?? 0) * MANA_DEPART_PCT);
    // Départage les égalités de compteur. Sans ça le tri, qui est stable,
    // ferait toujours jouer l'équipe A en premier : en PvP le camp attaquant
    // partait avec un avantage systématique.
    initiative[p.id] = random();
  }
  for (const p of equipeA) camp[p.id] = "A";
  for (const p of equipeB) camp[p.id] = "B";

  function vivants(c: "A" | "B") {
    return tous.filter((p) => camp[p.id] === c && pv[p.id] > 0);
  }

  /** Délai avant la prochaine action, ralentissement compris. */
  function intervalle(id: string): number {
    const p = parId[id];
    const malus = ralenti[id]?.tours > 0 ? ralenti[id].pourcentage : 0;
    const vitesse = Math.max(1, p.vitesse * (1 - malus / 100));
    return BASE_TICK / vitesse;
  }

  const events: CombatEvent3v3[] = [];

  /**
   * Applique des dégâts et tout ce qui en découle : critique, réduction,
   * vol de vie, épines, KO. Centralisé pour que les effets s'appliquent
   * toujours dans le même ordre, quelle que soit l'origine du coup.
   */
  function infliger(
    attaquantId: string,
    cibleId: string,
    brut: number,
    options: { spellName?: string; element?: string; riposte?: boolean } = {},
  ) {
    const critPct = passifs[attaquantId].critique;
    const critique = critPct > 0 && random() * 100 < critPct;
    const apresCrit = critique ? brut * 2 : brut;

    const reduction = passifs[cibleId].reductionDegats;
    const degats = Math.max(
      1,
      Math.round(apresCrit * (1 - Math.min(90, reduction) / 100)),
    );

    pv[cibleId] = Math.max(0, pv[cibleId] - degats);

    if (options.spellName) {
      events.push({
        type: "spellDegats",
        attackerId: attaquantId,
        defenderId: cibleId,
        spellName: options.spellName,
        element: options.element,
        damage: degats,
        defenderHpAfter: pv[cibleId],
        manaApres: mana[attaquantId],
        critique,
      });
    } else {
      events.push({
        type: "hit",
        attackerId: attaquantId,
        defenderId: cibleId,
        damage: degats,
        defenderHpAfter: pv[cibleId],
        manaApres: mana[attaquantId],
        critique,
      });
    }

    // Vol de vie : sur les dégâts réellement infligés.
    const vol = passifs[attaquantId].volDeVie;
    if (vol > 0 && pv[attaquantId] > 0) {
      const soin = Math.max(1, Math.round((degats * vol) / 100));
      pv[attaquantId] = Math.min(parId[attaquantId].vie, pv[attaquantId] + soin);
      events.push({
        type: "volDeVie",
        personnageId: attaquantId,
        heal: soin,
        hpAfter: pv[attaquantId],
      });
    }

    if (pv[cibleId] === 0) {
      events.push({ type: "ko", personnageId: cibleId });
      return;
    }

    // Épines : la riposte ne peut pas elle-même déclencher de riposte, sinon
    // deux porteurs d'épines se renverraient les dégâts sans fin.
    const epines = passifs[cibleId].epines;
    if (!options.riposte && epines > 0 && pv[attaquantId] > 0) {
      const renvoi = Math.max(1, Math.round((degats * epines) / 100));
      pv[attaquantId] = Math.max(0, pv[attaquantId] - renvoi);
      events.push({
        type: "epines",
        defenderId: cibleId,
        attackerId: attaquantId,
        damage: renvoi,
        attackerHpAfter: pv[attaquantId],
      });
      if (pv[attaquantId] === 0) {
        events.push({ type: "ko", personnageId: attaquantId });
      }
    }
  }

  let tours = 0;

  while (
    vivants("A").length > 0 &&
    vivants("B").length > 0 &&
    tours < MAX_TOURS
  ) {
    tours++;

    const enVie = tous.filter((p) => pv[p.id] > 0);
    enVie.sort(
      (a, b) =>
        compteur[a.id] - compteur[b.id] ||
        initiative[a.id] - initiative[b.id],
    );
    const attaquant = enVie[0];
    const id = attaquant.id;

    const manaMax = attaquant.manaMax ?? 0;
    mana[id] = Math.min(
      manaMax,
      mana[id] + Math.max(1, Math.round(manaMax * REGEN_MANA_PCT)),
    );

    // --- Effets de début de tour ------------------------------------------

    if (passifs[id].regeneration > 0 && pv[id] < attaquant.vie) {
      const soin = Math.max(
        1,
        Math.round((attaquant.vie * passifs[id].regeneration) / 100),
      );
      pv[id] = Math.min(attaquant.vie, pv[id] + soin);
      events.push({
        type: "regeneration",
        personnageId: id,
        heal: soin,
        hpAfter: pv[id],
      });
    }

    if (brulure[id]?.tours > 0) {
      const b = brulure[id];
      b.tours -= 1;
      pv[id] = Math.max(0, pv[id] - b.degats);
      events.push({
        type: "brulure",
        personnageId: id,
        damage: b.degats,
        hpAfter: pv[id],
        toursRestants: b.tours,
      });
      if (pv[id] === 0) {
        events.push({ type: "ko", personnageId: id });
        compteur[id] += intervalle(id);
        continue;
      }
    }

    if (ralenti[id]?.tours > 0) ralenti[id].tours -= 1;

    if (stun[id] > 0) {
      stun[id] -= 1;
      events.push({
        type: "stun",
        personnageId: id,
        toursRestants: stun[id],
        manaApres: mana[id],
      });
      compteur[id] += intervalle(id);
      continue;
    }

    // --- Action -----------------------------------------------------------

    const campAdverse = camp[id] === "A" ? "B" : "A";
    const pool = vivants(campAdverse);
    if (pool.length === 0) break;
    const defenseur = pool[Math.floor(random() * pool.length)];

    for (const sort of attaquant.sortsActifs ?? []) {
      if (cooldowns[id][sort.id] > 0) cooldowns[id][sort.id] -= 1;
    }

    const sortPret = (attaquant.sortsActifs ?? []).find(
      (s) => cooldowns[id][s.id] === 0 && mana[id] >= s.manaCost,
    );

    if (sortPret) {
      cooldowns[id][sortPret.id] = sortPret.cooldown;
      mana[id] -= sortPret.manaCost;
      const base = degatsDeBase(attaquant.force, defenseur.resistance, random);

      switch (sortPret.effect) {
        case "DEGATS": {
          const bonus = Math.round(base * (sortPret.value / 100));
          infliger(id, defenseur.id, base + bonus, {
            spellName: sortPret.name,
            element: sortPret.element,
          });
          break;
        }

        case "BRULURE": {
          // Le coup initial touche normalement, puis la brûlure s'installe.
          infliger(id, defenseur.id, base, {
            spellName: sortPret.name,
            element: sortPret.element,
          });
          if (pv[defenseur.id] > 0) {
            brulure[defenseur.id] = {
              degats: Math.max(1, Math.round((base * sortPret.value) / 100)),
              tours: sortPret.duree || 3,
            };
          }
          break;
        }

        case "DEGATS_ZONE": {
          // Frappe chaque ennemi encore debout. La liste est figée avant les
          // dégâts pour ne pas dépendre de l'ordre des KO.
          const cibles = vivants(campAdverse).map((p) => p.id);
          for (const cibleId of cibles) {
            if (pv[cibleId] <= 0) continue;
            const brut = degatsDeBase(
              attaquant.force,
              parId[cibleId].resistance,
              random,
            );
            infliger(id, cibleId, Math.round((brut * sortPret.value) / 100), {
              spellName: sortPret.name,
              element: sortPret.element,
            });
          }
          break;
        }

        case "RALENTISSEMENT": {
          ralenti[defenseur.id] = {
            pourcentage: Math.min(60, sortPret.value),
            tours: sortPret.duree || 3,
          };
          events.push({
            type: "spellRalentissement",
            casterId: id,
            targetId: defenseur.id,
            spellName: sortPret.name,
            pourcentage: ralenti[defenseur.id].pourcentage,
            tours: ralenti[defenseur.id].tours,
            manaApres: mana[id],
          });
          break;
        }

        case "SOIN": {
          // Le soin va à l'allié le plus mal en point, le lanceur compris.
          // Restreint au lanceur, il ne rattrapait jamais le tour d'attaque
          // sacrifié et équiper un soin faisait perdre le combat.
          const allies = vivants(camp[id]);
          const cible = allies.reduce((pire, p) =>
            pv[p.id] / p.vie < pv[pire.id] / pire.vie ? p : pire,
          );
          const heal = Math.round(cible.vie * (sortPret.value / 100));
          pv[cible.id] = Math.min(cible.vie, pv[cible.id] + heal);
          events.push({
            type: "spellSoin",
            casterId: cible.id,
            spellName: sortPret.name,
            heal,
            casterHpAfter: pv[cible.id],
            manaApres: mana[id],
          });
          break;
        }

        case "ETOURDISSEMENT": {
          stun[defenseur.id] = (stun[defenseur.id] ?? 0) + sortPret.value;
          events.push({
            type: "spellEtourdissement",
            casterId: id,
            targetId: defenseur.id,
            spellName: sortPret.name,
            tours: sortPret.value,
            manaApres: mana[id],
          });
          break;
        }
      }
    } else {
      const chance = chanceEsquive(defenseur.agilite, attaquant.force);

      if (random() * 100 < chance) {
        events.push({
          type: "dodge",
          attackerId: id,
          defenderId: defenseur.id,
          manaApres: mana[id],
        });
      } else {
        infliger(id, defenseur.id, degatsDeBase(attaquant.force, defenseur.resistance, random));
      }
    }

    compteur[id] += intervalle(id);
  }

  const winnerSide: "A" | "B" = vivants("A").length > 0 ? "A" : "B";
  return { events, winnerSide };
}
