// Nombre d'exemplaires du palier N nécessaires pour obtenir 1 exemplaire du palier N+1.
// Progression amorcée par le design initial (2, 2, 3) puis prolongée par paliers de 2 : 3, 4.
export const SEUILS_FUSION: Record<number, number> = {
  1: 2,
  2: 2,
  3: 3,
  4: 3,
  5: 4,
};

export const RARETE_MAX = 6;

export function seuilFusion(starsActuelles: number): number | null {
  return SEUILS_FUSION[starsActuelles] ?? null;
}

// Coût en or de la fusion, croissant avec le palier de départ.
export function coutFusionPersonnage(starsActuelles: number): number {
  return 100 * starsActuelles;
}

export function coutFusionObjet(starsActuelles: number): number {
  return 60 * starsActuelles;
}
