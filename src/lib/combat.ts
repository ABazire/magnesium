import { simulerCombatEquipe } from "./combatEquipe";
import type { CombatEvent3v3, PersonnageCombat3v3 } from "./combatEquipe";
import type { SortActifCombat } from "./personnage";

export type { SortActifCombat };

/**
 * Duel 1 contre 1.
 *
 * Il n'y a pas de moteur distinct pour le duel : c'est un combat d'équipe avec
 * un combattant de chaque côté. Tout ce qui est ajouté au moteur (brûlure,
 * critique, épines…) vaut donc automatiquement pour l'arène 1v1, sans rien
 * dupliquer.
 */

export type PersonnageCombat = PersonnageCombat3v3;
export type CombatEvent = CombatEvent3v3;

export function simulerCombat(
  perso1: PersonnageCombat,
  perso2: PersonnageCombat,
  seed: number,
) {
  const { events, winnerSide } = simulerCombatEquipe([perso1], [perso2], seed);

  return {
    events,
    winnerId: winnerSide === "A" ? perso1.id : perso2.id,
  };
}
