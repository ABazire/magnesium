"use client";

import { useState, useEffect, type ComponentType } from "react";
import type { CombatEvent } from "@/lib/combat";
import { PersonnageIcon, WolfTierIcon, BearTierIcon } from "@/components/pixel";
import styles from "./CombatViewer.module.css";

type IconeProps = {
  size?: number;
  couleur?: string;
  variant?: number;
  tier?: number;
};

const ICONES: Record<string, ComponentType<IconeProps>> = {
  personnage: PersonnageIcon,
  loup: WolfTierIcon,
  ours: BearTierIcon,
};

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

export default function CombatViewer({
  fighters,
  events,
  winnerId,
  background,
}: Props) {
  const [step, setStep] = useState(0);
  const vitesse = 900;

  const [f1, f2] = fighters;
  const Icone1 = ICONES[f1.iconKey ?? "personnage"] ?? PersonnageIcon;
  const Icone2 = ICONES[f2.iconKey ?? "personnage"] ?? PersonnageIcon;

  const vie: Record<string, number> = {
    [f1.id]: f1.vieMax,
    [f2.id]: f2.vieMax,
  };
  const mana: Record<string, number> = {
    [f1.id]: f1.manaMax ?? 0,
    [f2.id]: f2.manaMax ?? 0,
  };
  for (let i = 0; i < step; i++) {
    const ev = events[i];
    if (ev.type === "hit" || ev.type === "spellDegats") {
      vie[ev.defenderId] = ev.defenderHpAfter;
    } else if (ev.type === "spellSoin") {
      vie[ev.casterId] = ev.casterHpAfter;
    }
    const { acteur } = acteurCible(ev);
    if (acteur in mana) mana[acteur] = ev.manaApres;
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

  // Normalise les événements (attaquant/cible ou lanceur/cible) pour l'affichage.
  function acteurCible(ev: CombatEvent): { acteur: string; cible?: string } {
    switch (ev.type) {
      case "dodge":
      case "hit":
      case "spellDegats":
        return { acteur: ev.attackerId, cible: ev.defenderId };
      case "spellSoin":
        return { acteur: ev.casterId, cible: ev.casterId };
      case "spellEtourdissement":
        return { acteur: ev.casterId, cible: ev.targetId };
      case "stun":
        return { acteur: ev.personnageId };
    }
  }

  function classeSprite(id: string, cote: "gauche" | "droite") {
    if (termine || !evenementActuel) return styles.sprite;
    const { acteur, cible } = acteurCible(evenementActuel);
    const estActeur = acteur === id;
    const estCible = cible === id;

    if (estActeur && (evenementActuel.type === "hit" || evenementActuel.type === "spellDegats" || evenementActuel.type === "spellEtourdissement"))
      return `${styles.sprite} ${cote === "gauche" ? styles.lungeRight : styles.lungeLeft}`;
    if (estCible && (evenementActuel.type === "hit" || evenementActuel.type === "spellDegats"))
      return `${styles.sprite} ${styles.hitFlash}`;
    if (estCible && evenementActuel.type === "dodge")
      return `${styles.sprite} ${cote === "gauche" ? styles.dodgeLeft : styles.dodgeRight}`;
    return styles.sprite;
  }

  const taille1 = f1.tier === 5 ? 220 : 160;
  const taille2 = f2.tier === 5 ? 220 : 160;
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
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={styles.hpValue}>
                {vie[f.id]} / {f.vieMax}
              </span>
              {(f.manaMax ?? 0) > 0 && (
                <>
                  <div className={styles.manaBarTrack}>
                    <div
                      className={styles.manaBarFill}
                      style={{ width: `${pctMana}%` }}
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
        className={styles.stage}
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
        {" "}
        <div className={`${styles.fighterWrapper} ${styles.left}`}>
          <div className={styles.groundShadow} />
          <div
            className={styles.glow}
            style={{
              background: `radial-gradient(circle, ${couleur1}44, transparent 70%)`,
            }}
          />
          <div className={classeSprite(f1.id, "gauche")}>
            <Icone1
              size={taille1}
              couleur={f1.couleur}
              variant={f1.spriteVariant}
              tier={f1.tier}
            />
          </div>
          {!termine && evenementActuel && (
            <EvenementPopup ev={evenementActuel} personnageId={f1.id} />
          )}
        </div>
        <div className={`${styles.fighterWrapper} ${styles.right}`}>
          <div className={styles.groundShadow} />
          <div
            className={styles.glow}
            style={{
              background: `radial-gradient(circle, ${couleur2}44, transparent 70%)`,
            }}
          />
          <div
            className={classeSprite(f2.id, "droite")}
            style={{ transform: "scaleX(-1)" }}
          >
            <Icone2
              size={taille2}
              couleur={f2.couleur}
              variant={f2.spriteVariant}
              tier={f2.tier}
            />
          </div>
          {!termine && evenementActuel && (
            <EvenementPopup ev={evenementActuel} personnageId={f2.id} />
          )}
        </div>
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
      return <span className={styles.damagePopup}>-{ev.damage}</span>;
    case "dodge":
      if (ev.defenderId !== personnageId) return null;
      return <span className={styles.dodgePopup}>Esquive !</span>;
    case "spellDegats":
      if (ev.defenderId !== personnageId) return null;
      return (
        <span className={styles.damagePopup}>
          -{ev.damage}
          <span className={styles.spellName}>{ev.spellName}</span>
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
    case "stun":
      if (ev.personnageId !== personnageId) return null;
      return <span className={styles.statusPopup}>Ne peut pas agir</span>;
    default:
      return null;
  }
}
