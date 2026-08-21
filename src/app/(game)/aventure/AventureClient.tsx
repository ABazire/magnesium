// src/app/(game)/aventure/AventureClient.tsx
"use client";

import { useState } from "react";
import { affronterMonstre } from "../../actions/aventure";
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

  async function combattre(monsterId: string) {
    if (!personnageId) return;
    setEnCours(true);
    const res = await affronterMonstre(personnageId, monsterId);
    setResultat(res);
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
        {monstres.map((m) => (
          <button
            key={m.id}
            onClick={() => combattre(m.id)}
            disabled={!personnageId || enCours}
            className={styles.monsterButton}
          >
            Affronter {m.name}
          </button>
        ))}
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
