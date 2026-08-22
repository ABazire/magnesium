"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  WolfIcon,
  SwordIcon,
  StarIcon,
  ChestIcon,
} from "@/components/pixel";
import styles from "./NavBar.module.css";

const LIENS = [
  { href: "/jouer", label: "Accueil", Icone: HomeIcon },
  { href: "/aventure", label: "Aventure", Icone: WolfIcon },
  { href: "/arene", label: "Arène", Icone: SwordIcon },
  { href: "/gatcha", label: "Tirage", Icone: StarIcon },
  { href: "/coffre", label: "Coffres", Icone: ChestIcon },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {LIENS.map(({ href, label, Icone }) => {
        const actif = pathname === href;
        return (
          <Link key={href} href={href} className={styles.banner}>
            <div className={`${styles.hex} ${actif ? styles.hexActive : ""}`}>
              <Icone size={actif ? 26 : 20} />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
