// Mulberry32 — générateur pseudo-aléatoire simple et rapide, seedable
export function creerRng(seed: number) {
  let etat = seed;
  return function () {
    etat |= 0;
    etat = (etat + 0x6d2b79f5) | 0;
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
