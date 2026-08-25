function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")
  );
}

export function eclaircir(hex: string, quantite: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * quantite,
    g + (255 - g) * quantite,
    b + (255 - b) * quantite,
  );
}

export function assombrir(hex: string, quantite: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - quantite), g * (1 - quantite), b * (1 - quantite));
}
