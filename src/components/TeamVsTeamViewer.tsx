"use client";

import { useState, useEffect } from "react";
import type { CombatEvent3v3 } from "@/lib/combatEquipe";
import { PersonnageIcon } from "@/components/pixel";
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

  const tous = [...equipeA, ...equipeB];
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

  function renderColonne(equipe: Fighter3v3[]) {
    return equipe.map((f) => {
      const pct = Math.round((vie[f.id] / f.vieMax) * 100);
      const pctMana =
        f.manaMax > 0 ? Math.round((mana[f.id] / f.manaMax) * 100) : 0;
      const estActeur = acteur === f.id;
      const estCible = cible === f.id;
      const ko = vie[f.id] <= 0;

      return (
        <div
          key={f.id}
          className={`${styles.carte} ${estActeur ? styles.acteur : ""} ${
            estCible && !termine ? styles.cible : ""
          } ${ko ? styles.ko : ""}`}
        >
          <PersonnageIcon size={44} couleur={f.color} variant={f.spriteId} />
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

  return (
    <div className={styles.viewer}>
      <div className={styles.stage}>
        <div className={styles.equipeColonne}>
          <span className={styles.equipeNom}>{nomA}</span>
          {renderColonne(equipeA)}
        </div>

        <div className={styles.vs}>VS</div>

        <div className={styles.equipeColonne}>
          <span className={styles.equipeNom}>{nomB}</span>
          {renderColonne(equipeB)}
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
