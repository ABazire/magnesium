import { ImageResponse } from "next/og";
import { LOGO_AR3NA, PALETTE_LOGO } from "@/components/pixel/logo";
import { grillePixels } from "@/lib/pixelRaster";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const taillePixel = 22;
  const largeur = LOGO_AR3NA[0].length * taillePixel;
  const hauteur = LOGO_AR3NA.length * taillePixel;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          background: "#0f1a16",
        }}
      >
        <div style={{ position: "relative", width: largeur, height: hauteur, display: "flex" }}>
          {grillePixels(LOGO_AR3NA, PALETTE_LOGO, taillePixel)}
        </div>
        <div
          style={{
            display: "flex",
            color: "#9db8b1",
            fontSize: 32,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Recrute. Équipe. Combats.
        </div>
      </div>
    ),
    { ...size },
  );
}
