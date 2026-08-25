const K = 32; // facteur d'ajustement : plus il est haut, plus les points bougent vite

function probabiliteVictoire(rankA: number, rankB: number): number {
  return 1 / (1 + Math.pow(10, (rankB - rankA) / 400));
}

export function calculerNouveauxRangs(
  rankAttaquant: number,
  rankDefenseur: number,
  attaquantGagne: boolean,
) {
  const probaAttaquant = probabiliteVictoire(rankAttaquant, rankDefenseur);
  const probaDefenseur = 1 - probaAttaquant;

  const scoreAttaquant = attaquantGagne ? 1 : 0;
  const scoreDefenseur = attaquantGagne ? 0 : 1;

  const nouveauRankAttaquant = Math.round(
    rankAttaquant + K * (scoreAttaquant - probaAttaquant),
  );
  const nouveauRankDefenseur = Math.round(
    rankDefenseur + K * (scoreDefenseur - probaDefenseur),
  );

  return { nouveauRankAttaquant, nouveauRankDefenseur };
}
