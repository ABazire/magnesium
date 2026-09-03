"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMesQuetes, reclamerMaQuete } from "@/app/actions/quetes";
import type { QueteAffichee } from "@/lib/quetes";
import {
  IconeEnergieUI,
  IconeGemmeUI,
  IconePieceUI,
} from "@/components/pixel/IconesUI";
import styles from "./QuetesPanel.module.css";

function LigneRecompense({ recompense }: { recompense: QueteAffichee["recompense"] }) {
  return (
    <span className={styles.recompense}>
      {recompense.or ? (
        <span className={styles.item}>
          <IconePieceUI size={14} /> {recompense.or}
        </span>
      ) : null}
      {recompense.diamants ? (
        <span className={styles.item}>
          <IconeGemmeUI size={14} /> {recompense.diamants}
        </span>
      ) : null}
      {recompense.energie ? (
        <span className={styles.item}>
          <IconeEnergieUI size={14} /> {recompense.energie}
        </span>
      ) : null}
    </span>
  );
}

function LigneQuete({
  quete,
  onReclamer,
}: {
  quete: QueteAffichee;
  onReclamer: (cle: string) => void;
}) {
  const [enCours, setEnCours] = useState(false);

  async function reclamer() {
    setEnCours(true);
    try {
      await reclamerMaQuete(quete.cle);
      onReclamer(quete.cle);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <li className={styles.ligne}>
      <div className={styles.info}>
        <span className={styles.label}>{quete.label}</span>
        <div className={styles.barreTrack}>
          <div
            className={styles.barreFill}
            style={{
              width: `${Math.min(100, (quete.progres / quete.cible) * 100)}%`,
            }}
          />
        </div>
      </div>
      <LigneRecompense recompense={quete.recompense} />
      {quete.reclame ? (
        <span className={styles.fait}>Réclamé</span>
      ) : quete.complete ? (
        <button
          onClick={reclamer}
          disabled={enCours}
          className={styles.reclamerButton}
        >
          {enCours ? "…" : "Réclamer"}
        </button>
      ) : (
        <span className={styles.compte}>
          {quete.progres}/{quete.cible}
        </span>
      )}
    </li>
  );
}

/**
 * Widget de quêtes, présent sur toutes les pages du jeu (monté dans le
 * layout) : un onglet fixé sur le bord droit de l'écran, qui déplie un
 * tiroir plutôt que de prendre de la place en permanence sur une page.
 *
 * L'onglet reste visible même tiroir fermé pour que le badge de récompenses
 * à réclamer serve de rappel, quelle que soit la page où le joueur se
 * trouve — les quêtes se complètent aussi bien depuis l'aventure, l'arène,
 * le gatcha ou la forge, pas seulement depuis l'accueil.
 */
export default function QuetesPanel() {
  const router = useRouter();
  const [donnees, setDonnees] = useState<Awaited<
    ReturnType<typeof getMesQuetes>
  > | null>(null);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    let annule = false;
    getMesQuetes()
      .then((d) => {
        if (!annule) setDonnees(d);
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, []);

  if (!donnees) return null;

  const toutes = [donnees.connexion, ...donnees.quetes];
  const nbAReclamer = toutes.filter((q) => q.complete && !q.reclame).length;

  function actualiser(cle: string) {
    setDonnees((d) => {
      if (!d) return d;
      const majQuete = (q: QueteAffichee) =>
        q.cle === cle ? { ...q, reclame: true } : q;
      return {
        ...d,
        connexion: majQuete(d.connexion),
        quetes: d.quetes.map(majQuete),
      };
    });
    router.refresh();
  }

  return (
    <>
      <button
        className={styles.onglet}
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label="Quêtes du jour"
      >
        <span className={styles.ongletTexte}>Quêtes</span>
        {nbAReclamer > 0 && (
          <span className={styles.badge}>{nbAReclamer}</span>
        )}
      </button>

      {ouvert && (
        <>
          <div
            className={styles.fond}
            onClick={() => setOuvert(false)}
            aria-hidden="true"
          />
          <div className={styles.tiroir}>
            <div className={styles.entete}>
              <span className={styles.titre}>Quêtes du jour</span>
              <span className={styles.streak}>
                Connexion — jour {((donnees.streak - 1) % 7) + 1}/7
              </span>
              <button
                className={styles.fermer}
                onClick={() => setOuvert(false)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <ul className={styles.liste}>
              {toutes.map((q) => (
                <LigneQuete key={q.cle} quete={q} onReclamer={actualiser} />
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
