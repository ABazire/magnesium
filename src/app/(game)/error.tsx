"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./error.module.css";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Un problème est survenu</h1>
      <p className={styles.message}>
        Quelque chose s’est mal passé. Ce n’est probablement pas de ta faute —
        réessaie, et si ça persiste, reviens un peu plus tard.
      </p>

      <div className={styles.actions}>
        <button onClick={reset} className={styles.retryButton}>
          Réessayer
        </button>
        <Link href="/jouer" className={styles.homeLink}>
          Retour à l’accueil
        </Link>
      </div>

      {error.digest && (
        <p className={styles.digest}>Référence : {error.digest}</p>
      )}
    </main>
  );
}
