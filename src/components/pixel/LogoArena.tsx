import { LOGO_AR3NA, PALETTE_LOGO } from "./logo";

/**
 * Le logo « AR3NA » en SVG.
 *
 * Pas de PixelSprite ici : ce composant impose un carré (width=height), alors
 * que le mot-symbole est large et bas (29x7). Un simple viewBox proportionnel
 * évite la déformation ou le lettrboxing inutile.
 */
export default function LogoArena({
  width = 290,
  couleurLettres = PALETTE_LOGO.p,
  couleurAccent = PALETTE_LOGO.a,
  className,
}: {
  width?: number;
  couleurLettres?: string;
  couleurAccent?: string;
  className?: string;
}) {
  const cols = LOGO_AR3NA[0].length;
  const rows = LOGO_AR3NA.length;
  const height = Math.round((width * rows) / cols);
  const palette = { p: couleurLettres, a: couleurAccent };

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={width}
      height={height}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label="Ar3na"
    >
      {LOGO_AR3NA.map((ligne, y) =>
        [...ligne].map((char, x) => {
          const couleur = palette[char as keyof typeof palette];
          if (!couleur) return null;
          return (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={couleur} />
          );
        }),
      )}
    </svg>
  );
}
