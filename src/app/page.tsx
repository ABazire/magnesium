"use client";

import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AnimatedSprite } from "@/components/pixel/AnimatedSprite";
import {
  apparenceMonstre,
  apparencePersonnage,
} from "@/components/pixel/combattants";
import LogoArena from "@/components/pixel/LogoArena";

import styles from "./page.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();

  // Deux figurants animés en boucle : ils annoncent le style du jeu avant même
  // la connexion.
  const heros = useMemo(() => apparencePersonnage(0, "#10b981"), []);
  const bete = useMemo(() => apparenceMonstre("Loup", 2), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().length === 0 || enCours) return;

    setErreur(null);
    setEnCours(true);

    try {
      const result = await signIn("credentials", {
        username,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/jouer");
        return;
      }

      setErreur("Connexion impossible. Réessaie.");
    } catch {
      setErreur("Connexion impossible. Réessaie.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className={styles.ecran}>
      <LogoArena width={320} className={styles.logo} />
      <p className={styles.sousTitre}>Recrute. Équipe. Combats.</p>

      <div className={styles.heros}>
        <AnimatedSprite
          animations={heros.animations}
          etat="idle"
          palette={heros.palette}
          size={96}
        />
        <AnimatedSprite
          animations={bete.animations}
          etat="idle"
          palette={bete.palette}
          size={110}
          flip
        />
      </div>

      <form onSubmit={handleSubmit} className={styles.panneau}>
        <div className={styles.champ}>
          <label className={styles.label} htmlFor="username">
            Nom de joueur
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            autoComplete="username"
            required
          />
        </div>

        {erreur && <p className={styles.erreur}>{erreur}</p>}

        <button type="submit" disabled={enCours} className={styles.bouton}>
          {enCours ? "..." : "Jouer"}
        </button>
      </form>

      <span className={styles.invite}>Appuie sur Jouer pour commencer</span>
    </main>
  );
}
