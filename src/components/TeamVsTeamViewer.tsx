"use client";

import { useState, useEffect, useMemo } from "react";
import type { CombatEvent3v3 } from "@/lib/combatEquipe";
import { AnimatedSprite, EffetSprite } from "@/components/pixel/AnimatedSprite";
import { apparencePersonnage } from "@/components/pixel/combattants";
import {
  EFFET_SORT,
  PALETTE_SORT,
} from "@/components/pixel/animations";
import {
  acteurCible,
  appliquerEvenement,
  estImpact,
  estSort,
  effetVisuel,
  libelleEvenement,
} from "./combatEvents";
import styles from "./TeamVsTeamViewer.module.css";

type Fighter3v3 = {
  id: string;
  name: string;
  vieMax: number;
  manaMax: number;
  color?: string;
  spriteId?: number;
};

type Props = {
  equipeA: Fighter3v3[];
  equipeB: Fighter3v3[];
  nomA: string;
  nomB: string;
  events: CombatEvent3v3[];
  winnerSide: "A" | "B";
  onTermine?: () => void;
};


export default function TeamVsTeamViewer({
  equipeA,
  equipeB,
  nomA,
  nomB,
  events,
  winnerSide,
  onTermine,
}: Props) {
  const [step, setStep] = useState(0);
  const vitesse = 700;

  const tous = useMemo(() => [...equipeA, ...equipeB], [equipeA, equipeB]);

  const apparences = useMemo(
    () =>
      Object.fromEntries(
        tous.map((f) => [f.id, apparencePersonnage(f.spriteId ?? 0, f.color)]),
      ),
    [tous],
  );

  const nomParId: Record<string, string> = {};
  for (const f of tous) nomParId[f.id] = f.name;
  const nom = (id: string) => nomParId[id] ?? "?";

  const vie: Record<string, number> = {};
  const mana: Record<string, number> = {};
  for (const f of tous) {
    vie[f.id] = f.vieMax;
    mana[f.id] = f.manaMax;
  }

  for (let i = 0; i < step; i++) {
    appliquerEvenement(vie, mana, events[i]);
  }

  const termine = step >= events.length;
  const evenementActuel = events[step];
  const { acteur, cible } = evenementActuel
    ? acteurCible(evenementActuel)
    : {};

  useEffect(() => {
    if (termine) return;
    const timer = setTimeout(() => setStep((s) => s + 1), vitesse);
    return () => clearTimeout(timer);
  }, [step, termine]);

  useEffect(() => {
    if (termine) onTermine?.();
  }, [termine, onTermine]);

  function passerAnimation() {
    setStep(events.length);
  }

  function etatDe(id: string): string {
    if (vie[id] <= 0) return "ko";
    if (termine || !evenementActuel) return "idle";
    if (acteur === id) {
      if (evenementActuel.type === "spellSoin") return "incantation";
      if (evenementActuel.type === "stun") return "idle";
      return "attaque";
    }
    if (
      cible === id &&
      estImpact(evenementActuel)
    ) {
      return "touche";
    }
    return "idle";
  }

  function effetDe(id: string) {
    if (termine || !evenementActuel) return null;
    const ev = evenementActuel;

    if (estSort(ev) && acteur === id) {
      return { frames: EFFET_SORT, palette: PALETTE_SORT };
    }
    if (cible !== id) return null;

    return effetVisuel(ev);
  }

  function renderColonne(equipe: Fighter3v3[], flip: boolean) {
    return equipe.map((f) => {
      const pct = Math.round((vie[f.id] / f.vieMax) * 100);
      const pctMana =
        f.manaMax > 0 ? Math.round((mana[f.id] / f.manaMax) * 100) : 0;
      const estActeur = acteur === f.id;
      const estCible = cible === f.id;
      const ko = vie[f.id] <= 0;
      const etat = etatDe(f.id);
      const effet = effetDe(f.id);
      const apparence = apparences[f.id];

      return (
        <div
          key={f.id}
          className={`${styles.carte} ${estActeur ? styles.acteur : ""} ${
            estCible && !termine ? styles.cible : ""
          } ${ko ? styles.ko : ""}`}
        >
          <div className={styles.spriteWrapper}>
            {apparence && (
              <AnimatedSprite
                animations={apparence.animations}
                etat={etat}
                palette={apparence.palette}
                size={44}
                flip={flip}
              />
            )}
            {effet && (
              <div key={step} className={styles.effetOverlay}>
                <EffetSprite
                  frames={effet.frames}
                  palette={effet.palette}
                  size={52}
                  fps={10}
                />
              </div>
            )}
          </div>
          <div className={styles.infos}>
            <span className={styles.nom}>{f.name}</span>
            <div className={styles.barreTrack}>
              <div
                className={styles.barreVie}
                style={{ width: `${Math.max(0, pct)}%` }}
              />
            </div>
            {f.manaMax > 0 && (
              <div className={styles.barreTrack}>
                <div
                  className={styles.barreMana}
                  style={{ width: `${Math.max(0, pctMana)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  const secousse =
    !termine &&
    evenementActuel &&
    estImpact(evenementActuel);

  return (
    <div className={styles.viewer}>
      <div className={`${styles.stage} ${secousse ? styles.stageShake : ""}`}>
        <div className={styles.equipeColonne}>
          <span className={styles.equipeNom}>{nomA}</span>
          {renderColonne(equipeA, false)}
        </div>

        <div className={styles.vs}>VS</div>

        <div className={styles.equipeColonne}>
          <span className={styles.equipeNom}>{nomB}</span>
          {renderColonne(equipeB, true)}
        </div>
      </div>

      <div className={styles.journal}>
        {termine ? (
          <p className={styles.gagne}>
            {winnerSide === "A" ? nomA : nomB} remporte le combat !
          </p>
        ) : (
          evenementActuel && <p>{libelleEvenement(evenementActuel, nom)}</p>
        )}
      </div>

      {!termine && (
        <button onClick={passerAnimation} className={styles.skipButton}>
          Passer l’animation
        </button>
      )}
    </div>
  );
}
