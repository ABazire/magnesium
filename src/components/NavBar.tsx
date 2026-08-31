"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  IdCard,
  Compass,
  Trophy,
  Star,
  Gem,
  Swords,
  CircleStar,
  Zap,
  Ticket,
  Package,
} from "lucide-react";

import styles from "./NavBar.module.css";
import { ENERGY_MAX, COUPONS_MAX } from "@/lib/energyConstants";

const LIENS = [
  {
    href: "/jouer",
    label: "Accueil",
    Icone: IdCard,
  },
  { href: "/inventaire", label: "Inventaire", Icone: Package },
  {
    href: "/aventure",
    label: "Aventure",
    Icone: Compass,
  },
  {
    href: "/arene",
    label: "Arène",
    Icone: Swords,
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
        {/* Fond de la barre */}
        <div className={styles.navBackground} />

        {/* Les boutons */}
        <div className={styles.items}>
          {LIENS.map(({ href, label, Icone }) => {
            const actif = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`${styles.item} ${actif ? styles.itemActive : ""}`}
              >
                <Icone className={styles.icon} strokeWidth={2} />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Informations de monnaie */}
      <div className={styles.infos}>
        <div className={styles.currency}>
          <span className={styles.currencyLabel}>
            <CircleStar className={styles.icon} strokeWidth={2} size={32} />
          </span>
          <span className={styles.currencyValue}>{currency}</span>
        </div>

        <div className={styles.currency}>
          <span className={styles.currencyLabel}>
            <Gem className={styles.icon} strokeWidth={2} size={32} />
          </span>
          <span className={styles.diamondsValue}>{diamonds}</span>
        </div>

        <div className={styles.currency}>
          <span className={styles.currencyLabel}>
            <Zap className={styles.icon} strokeWidth={2} size={32} />
          </span>
          <span className={styles.currencyValue}>
            {energy}/{ENERGY_MAX}
          </span>
        </div>

        <div className={styles.currency}>
          <span className={styles.currencyLabel}>
            <Ticket className={styles.icon} strokeWidth={2} size={32} />
          </span>
          <span className={styles.currencyValue}>
            {coupons}/{COUPONS_MAX}
          </span>
        </div>
      </div>
    </header>
  );
}
