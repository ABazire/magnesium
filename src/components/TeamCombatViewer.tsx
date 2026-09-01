"use client";

import { useState, useEffect, type ComponentType } from "react";
import type { CombatEvent3v3 } from "@/lib/combatEquipe";
import { PersonnageIcon, WolfTierIcon, BearTierIcon } from "@/components/pixel";
import { Droplets, Sparkles, Feather, Gem } from "lucide-react";
import styles from "./TeamCombatViewer.module.css";

type IconeMonstreProps = { size?: number; tier?: number };

function sansTier(Icone: ComponentType<{ size?: number }>) {
  return function IconeSansTier({ size }: IconeMonstreProps) {
    return <Icone size={size} />;
  };
}

const ICONES: Record<string, ComponentType<IconeMonstreProps>> = {
  loup: WolfTierIcon,
  ours: BearTierIcon,
  slime: sansTier(Droplets),
  élémentaire: sansTier(Sparkles),
  griffon: sansTier(Feather),
  "serpent de cristal": sansTier(Gem),
};

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

export default function TeamCombatViewer({
  equipe,
  monstre,
  events,
  victoire,
  background,
}: Props) {
  const [step, setStep] = useState(0);
  const vitesse = 700;

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

  function passerAnimation() {
    setStep(events.length);
  }

  const IconeMonstre = ICONES[monstre.iconKey ?? ""] ?? ICONES.élémentaire;

  return (
    <div className={styles.viewer}>
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
        <div className={styles.equipeColonne}>
          {equipe.map((f) => {
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
          })}
        </div>

        <div
          className={`${styles.monstreCarte} ${acteur === monstre.id ? styles.acteur : ""} ${
            cible === monstre.id && !termine ? styles.cible : ""
          } ${vie[monstre.id] <= 0 ? styles.ko : ""}`}
        >
          <IconeMonstre size={72} tier={monstre.tier} />
          <span className={styles.nom}>{monstre.name}</span>
          <div className={styles.barreTrackLarge}>
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
