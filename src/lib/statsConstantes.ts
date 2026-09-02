/**
 * Constantes de conversion des statistiques brutes en valeurs de combat.
 *
 * Les personnages stockent en base des points de statistique tirés dans la
 * plage de leur rareté (0 à 30). Ces points ne sont pas directement des points
 * de vie : sans multiplicateur, un personnage aurait autant de PV que de force
 * et mourrait en un ou deux coups. La conversion se fait ici, à la lecture,
 * pour ne pas avoir à migrer les personnages déjà en base.
 */

/** Points de vie accordés par point de statistique « vie ». */
export const VIE_PAR_POINT = 5;

/** Mana de départ, avant le bonus de statistique. */
export const MANA_BASE = 20;
