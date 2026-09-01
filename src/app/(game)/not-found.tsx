import Link from "next/link";
import styles from "./error.module.css";

export default function GameNotFound() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Introuvable</h1>
      <p className={styles.message}>
        Cette page n’existe pas, ou plus.
      </p>

      <div className={styles.actions}>
        <Link href="/jouer" className={styles.homeLink}>
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
