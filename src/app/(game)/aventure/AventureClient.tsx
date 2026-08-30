"use client";

import { useState, useEffect } from "react";
import {
  affronterMonstre,
  getMonstresDisponibles,
} from "../../actions/aventure";
import { WolfTierIcon, BearTierIcon, PersonnageIcon } from "@/components/pixel";
import CombatViewer from "@/components/CombatViewer";
import Modal from "@/components/Modal";
import type { CombatEvent } from "@/lib/combat";
import styles from "./page.module.css";

type MonstreDispo = {
  id: string;
  name: string;
  baseName: string;
  tier: number;
  debloque: boolean;
};

type Fighter = {
  id: string;
  name: string;
  vieMax: number;
  color?: string;
  spriteId?: number;
};

type ResultatCombat = {
  events: CombatEvent[];
  victoire: boolean;
  gain: number;
  fighters: [Fighter, Fighter];
};

const ICONE_BASE: Record<string, typeof WolfTierIcon> = {
  Loup: WolfTierIcon,
  Ours: BearTierIcon,
};

const ZONES = [
  {
    baseName: "Loup",
    label: "Forêt des Hurlements",
    position: { top: "28%", left: "22%" },
  },
  {
    baseName: "Ours",
    label: "Antre de la Montagne",
    position: { top: "55%", left: "68%" },
  },
];

export default function AventureClient({
  personnages,
}: {
  personnages: { id: string; name: string }[];
}) {
  const [personnageId, setPersonnageId] = useState("");
  const [monstresDispo, setMonstresDispo] = useState<MonstreDispo[]>([]);
  const [zoneOuverte, setZoneOuverte] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<ResultatCombat | null>(null);
  const [fightKey, setFightKey] = useState(0);
  const [dernierMonstre, setDernierMonstre] = useState<MonstreDispo | null>(
    null,
  );

  useEffect(() => {
    getMonstresDisponibles().then(setMonstresDispo);
  }, [resultat]);

  function resolveIconKey(fighter: Fighter, baseName?: string) {
    return baseName ? baseName.toLowerCase() : "personnage";
  }

  async function combattre(monstre: MonstreDispo) {
    if (!personnageId) return;
    setEnCours(true);
    setDernierMonstre(monstre);
    setZoneOuverte(null);
    const res = await affronterMonstre(personnageId, monstre.id);
    setResultat(res);
    setFightKey((k) => k + 1);
    setEnCours(false);
  }

  function fermerCombat() {
    setResultat(null);
  }

  const monstresParZone = (baseName: string) =>
    monstresDispo
      .filter((m) => m.baseName === baseName)
      .sort((a, b) => a.tier - b.tier);

  const palierSuivant = dernierMonstre
    ? monstresDispo.find(
        (m) =>
          m.baseName === dernierMonstre.baseName &&
          m.tier === dernierMonstre.tier + 1,
      )
    : undefined;

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

      <div className={styles.map}>
        {ZONES.map((zone) => {
          const Icone = ICONE_BASE[zone.baseName];
          const tiers = monstresParZone(zone.baseName);
          const nbDebloques = tiers.filter((t) => t.debloque).length;

          return (
            <button
              key={zone.baseName}
              onClick={() => setZoneOuverte(zone.baseName)}
              className={styles.mapNode}
              style={{ top: zone.position.top, left: zone.position.left }}
              disabled={!personnageId}
            >
              <div className={styles.mapNodeIcon}>
                <Icone size={44} tier={Math.max(1, nbDebloques)} />
              </div>
              <span className={styles.mapNodeLabel}>{zone.label}</span>
            </button>
          );
        })}
      </div>

      {zoneOuverte && (
        <Modal onClose={() => setZoneOuverte(null)}>
          <h2 className={styles.modalTitle}>{zoneOuverte}</h2>
          <div className={styles.tierList}>
            {monstresParZone(zoneOuverte).map((m) => (
              <button
                key={m.id}
                onClick={() => combattre(m)}
                disabled={!m.debloque || enCours}
                className={
                  m.debloque ? styles.tierButton : styles.tierButtonLocked
                }
              >
                {m.debloque ? (
                  <span>Affronter {m.name}</span>
                ) : (
                  <span>🔒 {m.name} — verrouillé</span>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {resultat && dernierMonstre && (
        <div className={styles.combatOverlay}>
          <CombatViewer
            key={fightKey}
            fighters={[
              { ...resultat.fighters[0], iconKey: "personnage" },
              {
                ...resultat.fighters[1],
                iconKey: resolveIconKey(
                  resultat.fighters[1],
                  dernierMonstre.baseName,
                ),
                tier: dernierMonstre.tier,
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
              onClick={() => combattre(dernierMonstre)}
              className={styles.actionButton}
            >
              Recommencer
            </button>
            {resultat.victoire && palierSuivant?.debloque && (
              <button
                onClick={() => combattre(palierSuivant)}
                className={styles.actionButtonPrimary}
              >
                Niveau suivant
              </button>
            )}
            <button onClick={fermerCombat} className={styles.actionButton}>
              Retour à la carte
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
