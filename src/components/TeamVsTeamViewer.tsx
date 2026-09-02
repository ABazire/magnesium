"use client";

import { useState, useEffect, useMemo } from "react";
import type { CombatEvent3v3 } from "@/lib/combatEquipe";
import { AnimatedSprite, EffetSprite } from "@/components/pixel/AnimatedSprite";
import { apparencePersonnage } from "@/components/pixel/combattants";
import {
  EFFET_COUP,
  PALETTE_COUP,
  EFFET_IMPACT,
  PALETTE_IMPACT,
  EFFET_SOIN,
  PALETTE_SOIN,
  EFFET_ETOURDI,
  PALETTE_ETOURDI,
  EFFET_SORT,
  PALETTE_SORT,
} from "@/components/pixel/animations";
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

function acteurCible(ev: CombatEvent3v3): { acteur?: string; cible?: string } {
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
    case "ko":
      return { cible: ev.personnageId };
  }
}

function estSort(ev: CombatEvent3v3) {
  return (
    ev.type === "spellDegats" ||
    ev.type === "spellSoin" ||
    ev.type === "spellEtourdissement"
  );
}

function decrireEvenement(
  ev: CombatEvent3v3,
  nom: (id: string) => string,
): string {
  switch (ev.type) {
    case "dodge":
      return `${nom(ev.defenderId)} esquive l'attaque de ${nom(ev.attackerId)}`;
    case "hit":
      return `${nom(ev.attackerId)} inflige ${ev.damage} dégâts à ${nom(ev.defenderId)}`;
    case "spellDegats":
      return `${nom(ev.attackerId)} lance ${ev.spellName} : ${ev.damage} dégâts à ${nom(ev.defenderId)}`;
    case "spellSoin":
      return `${nom(ev.casterId)} lance ${ev.spellName} et récupère ${ev.heal} PV`;
    case "spellEtourdissement":
      return `${nom(ev.casterId)} lance ${ev.spellName} : ${nom(ev.targetId)} est étourdi`;
    case "stun":
      return `${nom(ev.personnageId)} est étourdi et ne peut pas agir`;
    case "ko":
      return `${nom(ev.personnageId)} est hors combat !`;
  }
}

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
    const ev = events[i];
    if (ev.type === "hit" || ev.type === "spellDegats") {
      vie[ev.defenderId] = ev.defenderHpAfter;
    } else if (ev.type === "spellSoin") {
      vie[ev.casterId] = ev.casterHpAfter;
    }
    if ("manaApres" in ev) {
      const { acteur } = acteurCible(ev);
      if (acteur && acteur in mana) mana[acteur] = ev.manaApres;
    }
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
      (evenementActuel.type === "hit" || evenementActuel.type === "spellDegats")
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

    switch (ev.type) {
      case "hit":
        return { frames: EFFET_COUP, palette: PALETTE_COUP };
      case "spellDegats":
        return { frames: EFFET_IMPACT, palette: PALETTE_IMPACT };
      case "spellSoin":
        return { frames: EFFET_SOIN, palette: PALETTE_SOIN };
      case "spellEtourdissement":
        return { frames: EFFET_ETOURDI, palette: PALETTE_ETOURDI };
      default:
        return null;
    }
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
    (evenementActuel.type === "hit" || evenementActuel.type === "spellDegats");

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
          evenementActuel && <p>{decrireEvenement(evenementActuel, nom)}</p>
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
