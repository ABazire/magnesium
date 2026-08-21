type Props = {
  grid: string[];
  palette: Record<string, string>;
  size?: number;
};

export default function PixelSprite({ grid, palette, size = 64 }: Props) {
  const cols = grid[0].length;
  const rows = grid.length;

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
    >
      {grid.map((ligne, y) =>
        ligne.split("").map((char, x) => {
          const couleur = palette[char];
          if (!couleur) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={couleur}
            />
          );
        }),
      )}
    </svg>
  );
}
