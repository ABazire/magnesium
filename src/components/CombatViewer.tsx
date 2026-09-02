"use client";

import { useState, useEffect, useMemo } from "react";
import type { CombatEvent } from "@/lib/combat";
import { AnimatedSprite, EffetSprite } from "@/components/pixel/AnimatedSprite";
import {
  apparencePersonnage,
  apparenceMonstre,
  type ApparenceCombattant,
} from "@/components/pixel/combattants";
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
} from "./combatEvents";
import styles from "./CombatViewer.module.css";

type Fighter = {
  id: string;
  name: string;
  vieMax: number;
  manaMax?: number;
  iconKey?: string;
  couleur?: string;
  spriteVariant?: number;
  tier?: number;
};

type Props = {
  fighters: [Fighter, Fighter];
  events: CombatEvent[];
  winnerId: string;
  background?: string;
};

function apparenceDe(f: Fighter): ApparenceCombattant {
  if (!f.iconKey || f.iconKey === "personnage") {
    return apparencePersonnage(f.spriteVariant ?? 0, f.couleur);
  }
  return apparenceMonstre(f.iconKey, f.tier ?? 1);
}

export default function CombatViewer({
  fighters,
  events,
  winnerId,
  background,
}: Props) {
  const [step, setStep] = useState(0);
  const vitesse = 900;

  const [f1, f2] = fighters;

  const apparence1 = useMemo(() => apparenceDe(f1), [f1]);
  const apparence2 = useMemo(() => apparenceDe(f2), [f2]);

  const vie: Record<string, number> = {
    [f1.id]: f1.vieMax,
    [f2.id]: f2.vieMax,
  };
  const mana: Record<string, number> = {
    [f1.id]: f1.manaMax ?? 0,
    [f2.id]: f2.manaMax ?? 0,
  };
  for (let i = 0; i < step; i++) {
    appliquerEvenement(vie, mana, events[i]);
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

  function etatDe(id: string): string {
    if (vie[id] <= 0) return "ko";
    if (termine || !evenementActuel) return "idle";

    const { acteur, cible } = acteurCible(evenementActuel);
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
    const { acteur, cible } = acteurCible(ev);

    if (estSort(ev) && acteur === id) {
      return { frames: EFFET_SORT, palette: PALETTE_SORT, taille: 90 };
    }
    if (cible !== id) return null;

    const effet = effetVisuel(ev);
    return effet ? { ...effet, taille: 115 } : null;
  }

  const secousse =
    !termine &&
    evenementActuel &&
    estImpact(evenementActuel);

  const taille1 = f1.tier === 5 ? 200 : 150;
  const taille2 = f2.tier === 5 ? 200 : 150;
  const couleur1 = f1.couleur ?? "#9db3aa";
  const couleur2 = f2.couleur ?? "#9db3aa";

  return (
    <div className={styles.viewer}>
      <div className={styles.hpRow}>
        {[f1, f2].map((f) => {
          const pct = Math.round((vie[f.id] / f.vieMax) * 100);
          const pctMana =
            (f.manaMax ?? 0) > 0
              ? Math.round((mana[f.id] / (f.manaMax ?? 1)) * 100)
              : 0;
          return (
            <div key={f.id} className={styles.hpBlock}>
              <span className={styles.fighterName}>{f.name}</span>
              <div className={styles.hpBarTrack}>
                <div
                  className={styles.hpBarFill}
                  style={{ width: `${Math.max(0, pct)}%` }}
                />
              </div>
              <span className={styles.hpValue}>
                {Math.max(0, vie[f.id])} / {f.vieMax}
              </span>
              {(f.manaMax ?? 0) > 0 && (
                <>
                  <div className={styles.manaBarTrack}>
                    <div
                      className={styles.manaBarFill}
                      style={{ width: `${Math.max(0, pctMana)}%` }}
                    />
                  </div>
                  <span className={styles.hpValue}>
                    {mana[f.id]} / {f.manaMax} mana
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`${styles.stage} ${secousse ? styles.stageShake : ""}`}
        style={
          background
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(15,26,22,0.15) 0%, rgba(15,26,22,0.6) 100%), url(${background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {[
          { f: f1, apparence: apparence1, taille: taille1, couleur: couleur1, flip: false },
          { f: f2, apparence: apparence2, taille: taille2, couleur: couleur2, flip: true },
        ].map(({ f, apparence, taille, couleur, flip }) => {
          const effet = effetDe(f.id);
          const etat = etatDe(f.id);

          return (
            <div key={f.id} className={styles.fighterWrapper}>
              <div className={styles.groundShadow} />
              <div
                className={styles.glow}
                style={{
                  background: `radial-gradient(circle, ${couleur}44, transparent 70%)`,
                }}
              />

              <div
                className={`${styles.sprite} ${etat === "ko" ? styles.spriteKo : ""}`}
              >
                <AnimatedSprite
                  animations={apparence.animations}
                  etat={etat}
                  palette={apparence.palette}
                  size={taille}
                  flip={flip}
                />
              </div>

              {effet && (
                <div key={step} className={styles.effetOverlay}>
                  <EffetSprite
                    frames={effet.frames}
                    palette={effet.palette}
                    size={effet.taille}
                    fps={10}
                  />
                </div>
              )}

              {!termine && evenementActuel && (
                <EvenementPopup ev={evenementActuel} personnageId={f.id} />
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
          Passer l’animation
        </button>
      )}
    </div>
  );
}

function EvenementPopup({
  ev,
  personnageId,
}: {
  ev: CombatEvent;
  personnageId: string;
}) {
  switch (ev.type) {
    case "hit":
      if (ev.defenderId !== personnageId) return null;
      return (
        <span className={styles.damagePopup}>
          -{ev.damage}
          {ev.critique && <span className={styles.spellName}>Critique !</span>}
        </span>
      );
    case "dodge":
      if (ev.defenderId !== personnageId) return null;
      return <span className={styles.dodgePopup}>Esquive !</span>;
    case "spellDegats":
      if (ev.defenderId !== personnageId) return null;
      return (
        <span className={styles.damagePopup}>
          -{ev.damage}
          <span className={styles.spellName}>
            {ev.critique ? `${ev.spellName} · critique` : ev.spellName}
          </span>
        </span>
      );
    case "spellSoin":
      if (ev.casterId !== personnageId) return null;
      return (
        <span className={styles.healPopup}>
          +{ev.heal}
          <span className={styles.spellName}>{ev.spellName}</span>
        </span>
      );
    case "spellEtourdissement":
      if (ev.targetId !== personnageId) return null;
      return <span className={styles.statusPopup}>Étourdi !</span>;
    case "spellRalentissement":
      if (ev.targetId !== personnageId) return null;
      return (
        <span className={styles.statusPopup}>Ralenti -{ev.pourcentage}%</span>
      );
    case "brulure":
      if (ev.personnageId !== personnageId) return null;
      return (
        <span className={styles.damagePopup}>
          -{ev.damage}
          <span className={styles.spellName}>Brûlure</span>
        </span>
      );
    case "epines":
      if (ev.attackerId !== personnageId) return null;
      return (
        <span className={styles.damagePopup}>
          -{ev.damage}
          <span className={styles.spellName}>Épines</span>
        </span>
      );
    case "regeneration":
      if (ev.personnageId !== personnageId) return null;
      return (
        <span className={styles.healPopup}>
          +{ev.heal}
          <span className={styles.spellName}>Régénération</span>
        </span>
      );
    case "volDeVie":
      if (ev.personnageId !== personnageId) return null;
      return (
        <span className={styles.healPopup}>
          +{ev.heal}
          <span className={styles.spellName}>Vol de vie</span>
        </span>
      );
    case "stun":
      if (ev.personnageId !== personnageId) return null;
      return <span className={styles.statusPopup}>Ne peut pas agir</span>;
    default:
      return null;
  }
}
