"use client";

import { useState, useEffect } from "react";
import type { CombatEvent } from "@/lib/combat";
import { PersonnageIcon, WolfIcon, BearIcon } from "@/components/pixel";
import styles from "./CombatViewer.module.css";

const ICONES: Record<string, typeof PersonnageIcon> = {
  personnage: PersonnageIcon,
  loup: WolfIcon,
  ours: BearIcon,
};

type Fighter = {
  id: string;
  name: string;
  vieMax: number;
  iconKey?: string; // "personnage" | "loup" | "ours" ...
};

type Props = {
  fighters: [Fighter, Fighter];
  events: CombatEvent[];
  winnerId: string;
};

export default function CombatViewer({ fighters, events, winnerId }: Props) {
  const [step, setStep] = useState(0);
  const vitesse = 900;

  const [f1, f2] = fighters;
  const Icone1 = ICONES[f1.iconKey ?? "personnage"] ?? PersonnageIcon;
  const Icone2 = ICONES[f2.iconKey ?? "personnage"] ?? PersonnageIcon;

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
  }, [step, termine]);

  function passerAnimation() {
    setStep(events.length);
  }

  const nom = (id: string) => (id === f1.id ? f1.name : f2.name);

  function classeSprite(id: string, cote: "gauche" | "droite") {
    if (termine || !evenementActuel) return styles.sprite;
    const estAttaquant = evenementActuel.attackerId === id;
    const estDefenseur = evenementActuel.defenderId === id;
    if (estAttaquant)
      return `${styles.sprite} ${cote === "gauche" ? styles.lungeRight : styles.lungeLeft}`;
    if (estDefenseur && evenementActuel.type === "hit")
      return `${styles.sprite} ${styles.hitFlash}`;
    if (estDefenseur && evenementActuel.type === "dodge")
      return `${styles.sprite} ${cote === "gauche" ? styles.dodgeLeft : styles.dodgeRight}`;
    return styles.sprite;
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.hpRow}>
        {[f1, f2].map((f) => {
          const pct = Math.round((vie[f.id] / f.vieMax) * 100);
          return (
            <div key={f.id} className={styles.hpBlock}>
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
            </div>
          );
        })}
      </div>

      <div className={styles.stage}>
        <div className={styles.stageFloor} />

        <div className={`${styles.fighterWrapper} ${styles.left}`}>
          <div className={classeSprite(f1.id, "gauche")}>
            <Icone1 size={72} />
          </div>
          {evenementActuel?.defenderId === f1.id &&
            evenementActuel.type === "hit" &&
            !termine && (
              <span className={styles.damagePopup}>
                -{evenementActuel.damage}
              </span>
            )}
          {evenementActuel?.defenderId === f1.id &&
            evenementActuel.type === "dodge" &&
            !termine && <span className={styles.dodgePopup}>Esquive !</span>}
        </div>

        <div className={`${styles.fighterWrapper} ${styles.right}`}>
          <div
            className={classeSprite(f2.id, "droite")}
            style={{ transform: "scaleX(-1)" }}
          >
            <Icone2 size={72} />
          </div>
          {evenementActuel?.defenderId === f2.id &&
            evenementActuel.type === "hit" &&
            !termine && (
              <span className={styles.damagePopup}>
                -{evenementActuel.damage}
              </span>
            )}
          {evenementActuel?.defenderId === f2.id &&
            evenementActuel.type === "dodge" &&
            !termine && <span className={styles.dodgePopup}>Esquive !</span>}
        </div>
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
