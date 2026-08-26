const CHANCE_DIAMANTS = 0.15;

export function tirerGainDiamants(): number {
  if (Math.random() >= CHANCE_DIAMANTS) return 0;
  return Math.floor(Math.random() * 5) + 1; // 1 à 5
}
