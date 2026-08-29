"use client";

import { useState, useEffect } from "react";
import {
  affronterMonstre,
  getMonstresDisponibles,
  getTentativesRestantes,
} from "../../actions/aventure";
import styles from "./page.module.css";
import { BearIcon, WolfIcon } from "@/components/pixel";
import CombatViewer from "@/components/CombatViewer";
import type { CombatEvent } from "@/lib/combat";
import { PersonnageIcon } from "@/components/pixel";
import { gagnerXp } from "@/lib/leveling";

type Props = {
  personnages: { id: string; name: string }[];
  monstres: { id: string; name: string }[];
};

export default function AventureClient({ personnages, monstres }: Props) {
  const ICONE_MONSTRE: Record<
    string,
    React.ComponentType<{ size?: number }>
  > = {
    Loup: WolfIcon,
    Ours: BearIcon,
  };

  const [personnageId, setPersonnageId] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [restantes, setRestantes] = useState<Record<string, number>>({});

  const [fightKey, setFightKey] = useState(0);

  type Fighter = {
    id: string;
    name: string;
    vieMax: number;
    color?: string;
    spriteId?: number;
    baseName?: string;
    tier?: number;
  };

  type ResultatCombat = {
    events: CombatEvent[];
    victoire: boolean;
    gain: number;
    fighters: [Fighter, Fighter];
  };

  const [resultat, setResultat] = useState<ResultatCombat | null>(null);

  useEffect(() => {
    if (!personnageId) {
      setRestantes({});
      return;
    }
    getTentativesRestantes(personnageId).then((data) => {
      const map: Record<string, number> = {};
      for (const r of data) map[r.monsterId] = r.restantes;
      setRestantes(map);
    });
  }, [personnageId]);

  async function combattre(monsterId: string) {
    console.log("combattre appelé avec monsterId =", monsterId);
    if (!personnageId) return;
    setDernierMonsterId(monsterId);
    setEnCours(true);
    const res = await affronterMonstre(personnageId, monsterId);
    console.log("fighter monstre:", res.fighters[1]);
    setResultat(res);

    setFightKey((k) => k + 1);
    setRestantes((prev) => ({
      ...prev,
      [monsterId]: Math.max(0, (prev[monsterId] ?? 0) - 1),
    }));
    setEnCours(false);
  }

  const [monstresDispo, setMonstresDispo] = useState<
    Awaited<ReturnType<typeof getMonstresDisponibles>>
  >([]);

  useEffect(() => {
    getMonstresDisponibles().then(setMonstresDispo);
  }, [resultat]); // se rafraîchit après chaque combat, au cas où un palier vient d'être débloqué

  const [dernierMonsterId, setDernierMonsterId] = useState<string | null>(null);

  function fermerCombat() {
    setResultat(null);
    getMonstresDisponibles().then(setMonstresDispo); // rafraîchit au cas où un palier vient d'être débloqué
  }

  const monstreActuel = monstresDispo.find((m) => m.id === dernierMonsterId);
  const palierSuivant = monstreActuel
    ? monstresDispo.find(
        (m) =>
          m.baseName === monstreActuel.baseName &&
          m.tier === monstreActuel.tier + 1,
      )
    : undefined;
  const palierSuivantDisponible = palierSuivant?.debloque ?? false;
  const palierSuivantId = palierSuivant?.id ?? null;

  function resolveIconKey(fighter: Fighter): string {
    return fighter.baseName ? fighter.baseName.toLowerCase() : "personnage";
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
        {monstresDispo.map((m) => {
          const restant = restantes[m.id];
          const epuise = Boolean(personnageId && restant === 0);
          const Icone = ICONE_MONSTRE[m.baseName];

          if (!m.debloque) {
            return (
              <div key={m.id} className={styles.monsterRowLocked}>
                <span className={styles.lockIcon}>🔒</span>
                <span>{m.name} — verrouillé</span>
              </div>
            );
          }

          return (
            <div key={m.id} className={styles.monsterRow}>
              <button
                onClick={() => combattre(m.id)}
                disabled={!personnageId || enCours || epuise}
                className={styles.monsterButton}
              >
                {Icone && <Icone size={32} />}
                Affronter {m.name}
              </button>
              {personnageId && restant !== undefined && (
                <span
                  className={epuise ? styles.limitReached : styles.remaining}
                >
                  {epuise
                    ? "Limite atteinte"
                    : `${restant} restant${restant > 1 ? "s" : ""} aujourd'hui`}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {resultat && (
        <>
          <div className={styles.combatOverlay}>
            <CombatViewer
              key={fightKey}
              fighters={[
                {
                  ...resultat.fighters[0],
                  iconKey: "personnage",
                  couleur: resultat.fighters[0].color,
                  spriteVariant: resultat.fighters[0].spriteId,
                },
                {
                  ...resultat.fighters[1],
                  iconKey: resolveIconKey(resultat.fighters[1]),
                  tier: resultat.fighters[1].tier,
                },
              ]}
              events={resultat.events}
              winnerId={
                resultat.victoire
                  ? personnageId
                  : resultat.fighters.find((f) => f.id !== personnageId)!.id
              }
            />
            <p className={resultat.victoire ? styles.gainWin : styles.gainLose}>
              +{resultat.gain} monnaie
            </p>
            <div className={styles.postCombatActions}>
              <button
                onClick={() => combattre(dernierMonsterId!)}
                className={styles.actionButton}
              >
                Recommencer
              </button>

              {resultat.victoire && palierSuivantDisponible && (
                <button
                  onClick={() => combattre(palierSuivantId!)}
                  className={styles.actionButtonPrimary}
                >
                  Niveau suivant
                </button>
              )}

              <button onClick={fermerCombat} className={styles.actionButton}>
                Retour aux niveaux
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
