export type PersonnageCombat = {
  id: string;
  name: string;
  vie: number;
  force: number;
  vitesse: number;
  resistance: number;
  agilite: number;
};

const BASE_TICK = 100;
const FACTEUR_REDUCTION = 0.5;
const ESQUIVE_MIN = 5;
const ESQUIVE_MAX = 60;
const MAX_TOURS = 200;

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

export function simulerCombat(
  perso1: PersonnageCombat,
  perso2: PersonnageCombat,
) {
  const pv: Record<string, number> = {
    [perso1.id]: perso1.vie,
    [perso2.id]: perso2.vie,
  };
  const compteur: Record<string, number> = {
    [perso1.id]: 0,
    [perso2.id]: 0,
  };
  const intervalle: Record<string, number> = {
    [perso1.id]: BASE_TICK / perso1.vitesse,
    [perso2.id]: BASE_TICK / perso2.vitesse,
  };
  const parId: Record<string, PersonnageCombat> = {
    [perso1.id]: perso1,
    [perso2.id]: perso2,
  };

  const log: string[] = [];
  let tours = 0;

  while (pv[perso1.id] > 0 && pv[perso2.id] > 0 && tours < MAX_TOURS) {
    tours++;

    const attaquantId =
      compteur[perso1.id] <= compteur[perso2.id] ? perso1.id : perso2.id;
    const defenseurId = attaquantId === perso1.id ? perso2.id : perso1.id;
    const attaquant = parId[attaquantId];
    const defenseur = parId[defenseurId];

    const chance = chanceEsquive(defenseur.agilite, attaquant.force);
    const jet = Math.random() * 100;

    if (jet < chance) {
      log.push(`${defenseur.name} esquive l'attaque de ${attaquant.name}.`);
    } else {
      const degats = calculerDegats(attaquant.force, defenseur.resistance);
      pv[defenseurId] = Math.max(0, pv[defenseurId] - degats);
      log.push(
        `${attaquant.name} attaque ${defenseur.name} et inflige ${degats} dégâts. (${defenseur.name} : ${pv[defenseurId]} PV restants)`,
      );
    }

    compteur[attaquantId] += intervalle[attaquantId];
  }

  const winnerId = pv[perso1.id] > 0 ? perso1.id : perso2.id;
  log.push(`${parId[winnerId].name} remporte le combat !`);

  return { log, winnerId };
}
