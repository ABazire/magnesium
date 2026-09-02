import type { Metadata } from "next";
import { Silkscreen, VT323 } from "next/font/google";
import "./globals.css";

// Deux polices pixel : Silkscreen (blocs, pour les titres et boutons) et
// VT323 (plus lisible en petit, pour le texte courant et les chiffres).
// Les deux couvrent les accents français, contrairement à Press Start 2P.
const silkscreen = Silkscreen({
  variable: "--font-titre",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
});

const vt323 = VT323({
  variable: "--font-corps",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Magnesium",
  description: "RPG de poche : recrute, équipe, et envoie tes équipes au combat.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${silkscreen.variable} ${vt323.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <div className="trameEcran" aria-hidden="true" />
        <div style={{ width: "80%", margin: "0 auto" }}>{children}</div>
      </body>
    </html>
  );
}
