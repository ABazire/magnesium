"use client";

import { useState, useEffect, useMemo } from "react";
import type { CombatEvent3v3 } from "@/lib/combatEquipe";
import { AnimatedSprite, EffetSprite } from "@/components/pixel/AnimatedSprite";
import {
  apparencePersonnage,
  apparenceMonstre,
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
  libelleEvenement,
} from "./combatEvents";
import styles from "./TeamCombatViewer.module.css";

type FighterEquipe = {
  id: string;
  name: string;
  vieMax: number;
  manaMax: number;
  color?: string;
  spriteId?: number;
};

type FighterMonstre = {
  id: string;
  name: string;
  vieMax: number;
  iconKey?: string;
  tier?: number;
};

type Props = {
  equipe: FighterEquipe[];
  monstre: FighterMonstre;
  events: CombatEvent3v3[];
  victoire: boolean;
  background?: string;
  onTermine?: () => void;
};


export default function TeamCombatViewer({
  equipe,
  monstre,
  events,
  victoire,
  background,
  onTermine,
}: Props) {
  const [step, setStep] = useState(0);
  const vitesse = 700;

  const apparencesEquipe = useMemo(
    () =>
      Object.fromEntries(
        equipe.map((f) => [
          f.id,
          apparencePersonnage(f.spriteId ?? 0, f.color),
        ]),
      ),
    [equipe],
  );
  const apparenceMonstreCourant = useMemo(
    () => apparenceMonstre(monstre.iconKey ?? "élémentaire", monstre.tier ?? 1),
    [monstre],
  );

  const nomParId: Record<string, string> = { [monstre.id]: monstre.name };
  for (const f of equipe) nomParId[f.id] = f.name;
  const nom = (id: string) => nomParId[id] ?? "?";

  const vie: Record<string, number> = { [monstre.id]: monstre.vieMax };
  const mana: Record<string, number> = {};
  for (const f of equipe) {
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

  const secousse =
    !termine &&
    evenementActuel &&
    estImpact(evenementActuel);

  // Seul contre trois : le boss occupe la scène, et grossit avec son palier.
  //
  // On raisonne en hauteur affichée plutôt qu'en taille de boîte : le SVG est
  // rendu dans un carré avec letterbox, donc une grille large (loup massif :
  // 35x20) n'occuperait qu'une fraction de la hauteur à boîte égale. En visant
  // une hauteur cible, la progression par palier reste monotone quelle que
  // soit la silhouette, et la largeur suit naturellement le sprite.
  const etatMonstre = etatDe(monstre.id);
  const effetMonstre = effetDe(monstre.id);
  const couleurBoss = apparenceMonstreCourant.palette["#"] ?? "#9db3aa";

  const palierBoss = Math.min(Math.max(monstre.tier ?? 1, 1), 5);
  const { colonnes, lignes } = apparenceMonstreCourant;
  const hauteurCible = 120 + palierBoss * 16;
  const tailleBoss = Math.min(
    360,
    Math.round((hauteurCible * Math.max(colonnes, lignes)) / Math.max(1, lignes)),
  );

  return (
    <div className={styles.viewer}>
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
        <div className={styles.equipeColonne}>
          {equipe.map((f) => {
            const pct = Math.round((vie[f.id] / f.vieMax) * 100);
            const pctMana =
              f.manaMax > 0 ? Math.round((mana[f.id] / f.manaMax) * 100) : 0;
            const etat = etatDe(f.id);
            const effet = effetDe(f.id);
            const apparence = apparencesEquipe[f.id];

            return (
              <div
                key={f.id}
                className={`${styles.carte} ${etat === "attaque" ? styles.acteur : ""} ${
                  etat === "touche" ? styles.cible : ""
                } ${etat === "ko" ? styles.ko : ""}`}
              >
                <div className={styles.spriteWrapper}>
                  {apparence && (
                    <AnimatedSprite
                      animations={apparence.animations}
                      etat={etat}
                      palette={apparence.palette}
                      size={44}
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
          })}
        </div>

        <div className={styles.monstreZone}>
          <div
            className={`${styles.monstreSprite} ${
              etatMonstre === "attaque" ? styles.monstreActeur : ""
            } ${etatMonstre === "touche" ? styles.monstreCible : ""} ${
              etatMonstre === "ko" ? styles.monstreKo : ""
            }`}
          >
            <div
              className={styles.auraBoss}
              style={{
                background: `radial-gradient(circle, ${couleurBoss}33, transparent 70%)`,
              }}
            />
            <div className={styles.ombreSol} />

            <AnimatedSprite
              animations={apparenceMonstreCourant.animations}
              etat={etatMonstre}
              palette={apparenceMonstreCourant.palette}
              size={tailleBoss}
              flip
            />

            {effetMonstre && (
              <div key={step} className={styles.effetOverlay}>
                <EffetSprite
                  frames={effetMonstre.frames}
                  palette={effetMonstre.palette}
                  size={Math.round(tailleBoss * 0.8)}
                  fps={10}
                />
              </div>
            )}
          </div>

          <span className={styles.nomBoss}>{monstre.name}</span>
          <div className={styles.barreBoss}>
            <div
              className={styles.barreVie}
              style={{
                width: `${Math.max(0, Math.round((vie[monstre.id] / monstre.vieMax) * 100))}%`,
              }}
            />
          </div>
          <span className={styles.hpValue}>
            {Math.max(0, vie[monstre.id])} / {monstre.vieMax}
          </span>
        </div>
      </div>

      <div className={styles.journal}>
        {termine ? (
          <p className={victoire ? styles.gagne : styles.perdu}>
            {victoire ? "Victoire !" : "Défaite..."}
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
