"use client";

import Link from "next/link";

import { IdCard, Compass, Trophy, Star, Gem, Swords } from "lucide-react";

import styles from "./NavBar.module.css";

const LIENS = [
  {
    href: "/jouer",
    label: "Accueil",
    Icone: IdCard,
  },
  {
    href: "/aventure",
    label: "Aventure",
    Icone: Compass,
  },
  {
    href: "/arene",
    label: "Arène",
    Icone: Swords,
    actif: true,
  },
  {
    href: "/classement",
    label: "Classement",
    Icone: Trophy,
  },
  {
    href: "/gatcha",
    label: "Recrutement",
    Icone: Star,
  },
  {
    href: "/coffre",
    label: "Coffres",
    Icone: Gem,
  },
];

type NavBarProps = {
  currency: number;
  diamonds: number;
};

export default function NavBar({ currency, diamonds }: NavBarProps) {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        {/* Fond de la barre */}
        <div className={styles.navBackground} />

        {/* Les boutons */}
        <div className={styles.items}>
          {LIENS.map(({ href, label, Icone, actif }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`${styles.item} ${actif ? styles.itemActive : ""}`}
            >
              <Icone className={styles.icon} strokeWidth={2} />
            </Link>
          ))}
        </div>
      </nav>

      {/* Informations de monnaie */}
      <div className={styles.infos}>
        <div className={styles.currency}>
          <span className={styles.currencyLabel}>Monnaie</span>

          <span className={styles.currencyValue}>{currency}</span>
        </div>

        <div className={styles.currency}>
          <span className={styles.currencyLabel}>Diamants</span>

          <span className={styles.diamondsValue}>{diamonds}</span>
        </div>
      </div>
    </header>
  );
}
