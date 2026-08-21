"use client";

import { useState, useEffect } from "react";
import type { CombatEvent } from "@/lib/combat";
import styles from "./CombatViewer.module.css";

type Fighter = { id: string; name: string; vieMax: number };

type Props = {
  fighters: [Fighter, Fighter];
  events: CombatEvent[];
  winnerId: string;
};

export default function CombatViewer({ fighters, events, winnerId }: Props) {
  const [step, setStep] = useState(0);
  const [vitesse, setVitesse] = useState(900); // ms entre chaque tour

  const [f1, f2] = fighters;

  // Vie actuelle de chaque combattant, recalculée en fonction des événements déjà "joués"
  const vie: Record<string, number> = {
    [f1.id]: f1.vieMax,
    [f2.id]: f2.vieMax,
  };
  for (let i = 0; i < step; i++) {
    const ev = events[i];
    if (ev.type === "hit") vie[ev.defenderId] = ev.defenderHpAfter;
  }

  const termine = step >= events.length;
  const evenementActuel = events[step];

  useEffect(() => {
    if (termine) return;
    const timer = setTimeout(() => setStep((s) => s + 1), vitesse);
    return () => clearTimeout(timer);
  }, [step, termine, vitesse]);

  function passerAnimation() {
    setStep(events.length);
  }

  const nom = (id: string) => (id === f1.id ? f1.name : f2.name);

  return (
    <div className={styles.viewer}>
      <div className={styles.fightersRow}>
        {[f1, f2].map((f) => {
          const pct = Math.round((vie[f.id] / f.vieMax) * 100);
          const estAttaquant = !termine && evenementActuel?.attackerId === f.id;
          const estDefenseur = !termine && evenementActuel?.defenderId === f.id;
          return (
            <div
              key={f.id}
              className={`${styles.fighterCard} ${estAttaquant ? styles.attacking : ""} ${estDefenseur && evenementActuel?.type === "hit" ? styles.hit : ""}`}
            >
              <span className={styles.fighterName}>{f.name}</span>
              <div className={styles.hpBarTrack}>
                <div
                  className={styles.hpBarFill}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={styles.hpValue}>
                {vie[f.id]} / {f.vieMax}
              </span>
              {estDefenseur && evenementActuel?.type === "hit" && (
                <span className={styles.damagePopup}>
                  -{evenementActuel.damage}
                </span>
              )}
              {estDefenseur && evenementActuel?.type === "dodge" && (
                <span className={styles.dodgePopup}>Esquive !</span>
              )}
            </div>
          );
        })}
      </div>

      {termine ? (
        <p className={styles.winnerBanner}>
          {nom(winnerId)} remporte le combat !
        </p>
      ) : (
        <button onClick={passerAnimation} className={styles.skipButton}>
          Passer l'animation
        </button>
      )}
    </div>
  );
}
