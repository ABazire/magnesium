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

const DESCRIPTION =
  "Ar3na : RPG de poche en pixel art. Recrute des personnages, équipe-les de sorts élémentaires et d'équipement, puis affronte l'aventure, l'arène et le boss de guilde.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ar3na.vercel.app",
  ),
  title: {
    default: "Ar3na",
    template: "%s · Ar3na",
  },
  description: DESCRIPTION,
  applicationName: "Ar3na",
  keywords: [
    "Ar3na",
    "RPG",
    "gacha",
    "jeu de rôle",
    "pixel art",
    "navigateur",
  ],
  appleWebApp: {
    title: "Ar3na",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Ar3na",
    description: DESCRIPTION,
    siteName: "Ar3na",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ar3na",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${silkscreen.variable} ${vt323.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <div className="trameEcran" aria-hidden="true" />
        <div className="coquille">{children}</div>
      </body>
    </html>
  );
}
