"use client";

import { useState, useEffect } from "react";
import {
  affronterMonstre,
  getTentativesRestantes,
} from "../../actions/aventure";
import styles from "./page.module.css";

type Props = {
  personnages: { id: string; name: string }[];
  monstres: { id: string; name: string }[];
};

export default function AventureClient({ personnages, monstres }: Props) {
  const [personnageId, setPersonnageId] = useState("");
  const [resultat, setResultat] = useState<{
    log: string[];
    victoire: boolean;
    gain: number;
  } | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [restantes, setRestantes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!personnageId) {
      setRestantes({});
      return;
    }
    getTentativesRestantes(personnageId).then((data) => {
      const map: Record<string, number> = {};
      for (const r of data) map[r.monsterId] = r.restantes;
      setRestantes(map);
    });
  }, [personnageId]);

  async function combattre(monsterId: string) {
    if (!personnageId) return;
    setEnCours(true);
    const res = await affronterMonstre(personnageId, monsterId);
    setResultat(res);
    setRestantes((prev) => ({
      ...prev,
      [monsterId]: Math.max(0, (prev[monsterId] ?? 0) - 1),
    }));
    setEnCours(false);
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Aventure</h1>

      <select
        value={personnageId}
        onChange={(e) => setPersonnageId(e.target.value)}
        className={styles.select}
      >
        <option value="">Choisis ton personnage</option>
        {personnages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className={styles.monsterList}>
        {monstres.map((m) => {
          const restant = restantes[m.id];
          const epuise = personnageId && restant === 0;
          return (
            <div key={m.id} className={styles.monsterRow}>
              <button
                onClick={() => combattre(m.id)}
                disabled={!personnageId || enCours || epuise}
                className={styles.monsterButton}
              >
                Affronter {m.name}
              </button>
              {personnageId && restant !== undefined && (
                <span
                  className={epuise ? styles.limitReached : styles.remaining}
                >
                  {epuise
                    ? "Limite atteinte"
                    : `${restant} restant${restant > 1 ? "s" : ""} aujourd'hui`}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {resultat && (
        <div className={styles.log}>
          {resultat.log.map((ligne, i) => (
            <p key={i} className={styles.logLine}>
              {ligne}
            </p>
          ))}
          <p className={resultat.victoire ? styles.gainWin : styles.gainLose}>
            +{resultat.gain} monnaie
          </p>
        </div>
      )}
    </main>
  );
}
