"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import PixelSprite from "./pixel/PixelSprite";
import {
  ICONE_ACCUEIL,
  ICONE_ARENE,
  ICONE_AVENTURE,
  ICONE_CLASSEMENT,
  ICONE_ENERGIE,
  ICONE_FORGE,
  ICONE_GEMME,
  ICONE_GUILDE,
  ICONE_INVENTAIRE,
  ICONE_PIECE,
  ICONE_RECRUTEMENT,
  ICONE_TICKET,
  PALETTE_ENERGIE,
  PALETTE_GEMME,
  PALETTE_PIECE,
  PALETTE_TICKET,
  paletteIcone,
} from "./pixel/icones";

import styles from "./NavBar.module.css";
import { ENERGY_MAX, COUPONS_MAX } from "@/lib/energyConstants";

const LIENS = [
  { href: "/jouer", label: "Accueil", grille: ICONE_ACCUEIL },
  { href: "/inventaire", label: "Inventaire", grille: ICONE_INVENTAIRE },
  { href: "/aventure", label: "Aventure", grille: ICONE_AVENTURE },
  { href: "/arene", label: "Arène", grille: ICONE_ARENE },
  { href: "/classement", label: "Classement", grille: ICONE_CLASSEMENT },
  { href: "/gatcha", label: "Recrutement", grille: ICONE_RECRUTEMENT },
  { href: "/forge", label: "Forge", grille: ICONE_FORGE },
  { href: "/guilde", label: "Guilde", grille: ICONE_GUILDE },
];

const PALETTE_ONGLET = paletteIcone("#b7c396", "#8f9d6d");
const PALETTE_ONGLET_ACTIF = paletteIcone("#2c3b24", "#4a5c38");

type NavBarProps = {
  currency: number;
  diamonds: number;
  energy: number;
  coupons: number;
};

export default function NavBar({
  currency,
  diamonds,
  energy,
  coupons,
}: NavBarProps) {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div></div>
      <nav className={styles.nav}>
        <div className={styles.navBackground} />

        <div className={styles.items}>
          {LIENS.map(({ href, label, grille }) => {
            const actif = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className={`${styles.item} ${actif ? styles.itemActive : ""}`}
              >
                <span className={styles.icon}>
                  <PixelSprite
                    grid={grille}
                    palette={actif ? PALETTE_ONGLET_ACTIF : PALETTE_ONGLET}
                    size={actif ? 30 : 26}
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={styles.infos}>
        <div className={styles.currency}>
          <PixelSprite grid={ICONE_PIECE} palette={PALETTE_PIECE} size={18} />
          <span className={styles.currencyValue}>{currency}</span>
        </div>

        <div className={styles.currency}>
          <PixelSprite grid={ICONE_GEMME} palette={PALETTE_GEMME} size={18} />
          <span className={styles.diamondsValue}>{diamonds}</span>
        </div>

        <div className={styles.currency}>
          <PixelSprite
            grid={ICONE_ENERGIE}
            palette={PALETTE_ENERGIE}
            size={18}
          />
          <span className={styles.currencyValue}>
            {energy}/{ENERGY_MAX}
          </span>
        </div>

        <div className={styles.currency}>
          <PixelSprite grid={ICONE_TICKET} palette={PALETTE_TICKET} size={18} />
          <span className={styles.currencyValue}>
            {coupons}/{COUPONS_MAX}
          </span>
        </div>
      </div>
    </header>
  );
}
