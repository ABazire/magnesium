import { ImageResponse } from "next/og";
import { MONOGRAMME_3, PALETTE_MONOGRAMME } from "@/components/pixel/logo";
import { grillePixels } from "@/lib/pixelRaster";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const taillePixel = 4; // grille 5x7 * 4px = 20x28, centrée dans 32x32
  const largeur = MONOGRAMME_3[0].length * taillePixel;
  const hauteur = MONOGRAMME_3.length * taillePixel;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1a16",
        }}
      >
        <div style={{ position: "relative", width: largeur, height: hauteur, display: "flex" }}>
          {grillePixels(MONOGRAMME_3, PALETTE_MONOGRAMME, taillePixel)}
        </div>
      </div>
    ),
    { ...size },
  );
}
