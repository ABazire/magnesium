const XP_PAR_VICTOIRE = 20;

export function xpRequisePourNiveauSuivant(level: number): number {
  return level * 50;
}

export function niveauMax(stars: number): number {
  return stars * 10;
}

export function bonusStatsParNiveau(level: number): number {
  return level - 1; // niveau 1 = pas de bonus, chaque niveau au-dessus ajoute +1 à chaque stat
}

export function gagnerXp(
  levelActuel: number,
  xpActuelle: number,
  starsRarete: number,
  xpGagnee: number = XP_PAR_VICTOIRE,
): { newLevel: number; newXp: number; leveledUp: boolean } {
  const max = niveauMax(starsRarete);

  if (levelActuel >= max) {
    return { newLevel: levelActuel, newXp: xpActuelle, leveledUp: false };
  }

  let level = levelActuel;
  let xp = xpActuelle + xpGagnee;
  let leveledUp = false;

  while (level < max && xp >= xpRequisePourNiveauSuivant(level)) {
    xp -= xpRequisePourNiveauSuivant(level);
    level++;
    leveledUp = true;
  }

  if (level >= max) {
    xp = 0; // niveau max atteint, plus besoin de suivre l'XP
  }

  return { newLevel: level, newXp: xp, leveledUp };
}
