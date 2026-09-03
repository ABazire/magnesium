/**
 * Rendu d'une grille de pixels en div positionnées, pour les images générées
 * par code (favicon, icône iOS, image de partage).
 *
 * `next/og` (Satori) ne supporte qu'un sous-ensemble de CSS — flexbox et
 * positionnement absolu, pas `display: grid` — donc pas question de
 * réutiliser PixelSprite (du SVG). Chaque pixel devient une div carrée
 * positionnée en absolu, ce qui reste dans le sous-ensemble garanti.
 */
export function grillePixels(
  grille: string[],
  palette: Record<string, string>,
  taillePixel: number,
) {
  const elements: React.ReactElement[] = [];
  grille.forEach((ligne, y) => {
    [...ligne].forEach((char, x) => {
      const couleur = palette[char];
      if (!couleur) return;
      elements.push(
        <div
          key={`${x}-${y}`}
          style={{
            position: "absolute",
            left: x * taillePixel,
            top: y * taillePixel,
            width: taillePixel,
            height: taillePixel,
            background: couleur,
          }}
        />,
      );
    });
  });
  return elements;
}
