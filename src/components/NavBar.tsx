"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NavBar.module.css";

const LIENS = [
  { href: "/jouer", label: "Accueil" },
  { href: "/combat", label: "Combat" },
  { href: "/arene", label: "Arène" },
  { href: "/gatcha", label: "Tirage" },
  { href: "/coffre", label: "Coffres" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {LIENS.map((lien) => (
        <Link
          key={lien.href}
          href={lien.href}
          className={pathname === lien.href ? styles.linkActive : styles.link}
        >
          {lien.label}
        </Link>
      ))}
    </nav>
  );
}
