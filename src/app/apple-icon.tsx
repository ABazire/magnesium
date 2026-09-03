import { ImageResponse } from "next/og";
import { MONOGRAMME_3, PALETTE_MONOGRAMME } from "@/components/pixel/logo";
import { grillePixels } from "@/lib/pixelRaster";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const taillePixel = 20; // grille 5x7 * 20px = 100x140, centrée dans 180x180
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
