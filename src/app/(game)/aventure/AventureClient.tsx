"use client";

import { useState, useEffect, type ComponentType } from "react";
import Link from "next/link";
import {
  affronterMonstre,
  getMonstresDisponibles,
} from "../../actions/aventure";
import { WolfTierIcon, BearTierIcon, PersonnageIcon } from "@/components/pixel";
import { Droplets, Sparkles, Feather, Gem } from "lucide-react";
import TeamCombatViewer from "@/components/TeamCombatViewer";
import Modal from "@/components/Modal";
import { NOMS_MATERIAU } from "@/lib/monsterDrops";
import type { CombatEvent3v3 } from "@/lib/combatEquipe";
import type { MaterialType } from "@prisma/client";
import styles from "./page.module.css";

type MonstreDispo = {
  id: string;
  name: string;
  baseName: string;
  tier: number;
  debloque: boolean;
};

type MembreEquipe = {
  position: number;
  personnage: {
    id: string;
    name: string;
    color: string;
    spriteId: number;
  };
};

type Equipe = {
  id: string;
  name: string;
  membres: MembreEquipe[];
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
  baseName?: string;
  tier?: number;
};

type ResultatCombat = {
  events: CombatEvent3v3[];
  victoire: boolean;
  gain: number;
  materiaux: { type: MaterialType; quantity: number }[];
  equipe: FighterEquipe[];
  monstre: FighterMonstre;
};

function sansTier(Icone: ComponentType<{ size?: number }>) {
  return function IconeSansTier({ size }: { size?: number; tier?: number }) {
    return <Icone size={size} />;
  };
}

const ICONE_BASE: Record<string, ComponentType<{ size?: number; tier?: number }>> = {
  Loup: WolfTierIcon,
  Ours: BearTierIcon,
  Slime: sansTier(Droplets),
  Élémentaire: sansTier(Sparkles),
  Griffon: sansTier(Feather),
  "Serpent de Cristal": sansTier(Gem),
};

const ZONES = [
  {
    baseName: "Loup",
    label: "Forêt des Hurlements",
    position: { top: "18%", left: "15%" },
  },
  {
    baseName: "Ours",
    label: "Antre de la Montagne",
    position: { top: "45%", left: "72%" },
  },
  {
    baseName: "Slime",
    label: "Marais Gluant",
    position: { top: "78%", left: "18%" },
  },
  {
    baseName: "Élémentaire",
    label: "Plaine des Éclats",
    position: { top: "15%", left: "68%" },
  },
  {
    baseName: "Griffon",
    label: "Pics du Griffon",
    position: { top: "40%", left: "40%" },
  },
  {
    baseName: "Serpent de Cristal",
    label: "Grotte de Cristal",
    position: { top: "75%", left: "60%" },
  },
];

const SCENES: Record<string, string> = {
  Loup: "/scenes/foret.jpg",
};

export default function AventureClient({ equipes }: { equipes: Equipe[] }) {
  const [equipeId, setEquipeId] = useState("");
  const [monstresDispo, setMonstresDispo] = useState<MonstreDispo[]>([]);
  const [zoneOuverte, setZoneOuverte] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<ResultatCombat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fightKey, setFightKey] = useState(0);
  const [dernierMonstre, setDernierMonstre] = useState<MonstreDispo | null>(
    null,
  );

  const equipeSelectionnee = equipes.find((e) => e.id === equipeId);
  const equipeComplete = (equipeSelectionnee?.membres.length ?? 0) === 3;
  const sceneActuelle = dernierMonstre
    ? SCENES[dernierMonstre.baseName]
    : undefined;

  useEffect(() => {
    getMonstresDisponibles().then(setMonstresDispo);
  }, [resultat]);

  async function combattre(monstre: MonstreDispo) {
    if (!equipeComplete) return;
    setErreur(null);
    setEnCours(true);
    setDernierMonstre(monstre);
    setZoneOuverte(null);
    try {
      const res = await affronterMonstre(equipeId, monstre.id);
      setResultat(res);
      setFightKey((k) => k + 1);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setEnCours(false);
    }
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

      <div className={styles.equipeSelecteur}>
        <select
          value={equipeId}
          onChange={(e) => setEquipeId(e.target.value)}
          className={styles.select}
        >
          <option value="">Choisis ton équipe</option>
          {equipes.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name} ({eq.membres.length}/3)
            </option>
          ))}
        </select>

        {equipeSelectionnee && (
          <div className={styles.equipeApercu}>
            {equipeSelectionnee.membres.map((m) => (
              <PersonnageIcon
                key={m.personnage.id}
                size={32}
                couleur={m.personnage.color}
                variant={m.personnage.spriteId}
              />
            ))}
          </div>
        )}

        <Link href="/jouer" className={styles.gererLien}>
          Gérer mes équipes
        </Link>
      </div>

      {equipeId && !equipeComplete && (
        <p className={styles.avertissement}>
          Cette équipe n’a pas encore 3 personnages — complète-la sur la page
          d’accueil avant de partir à l’aventure.
        </p>
      )}

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
              disabled={!equipeComplete}
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
          {erreur && <p className={styles.avertissement}>{erreur}</p>}
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
          <TeamCombatViewer
            key={fightKey}
            equipe={resultat.equipe}
            monstre={{
              ...resultat.monstre,
              iconKey: dernierMonstre.baseName.toLowerCase(),
              tier: dernierMonstre.tier,
            }}
            events={resultat.events}
            victoire={resultat.victoire}
            background={sceneActuelle}
          />

          <p className={resultat.victoire ? styles.gainWin : styles.gainLose}>
            +{resultat.gain} monnaie
          </p>

          {resultat.materiaux.length > 0 && (
            <p className={styles.gainWin}>
              {resultat.materiaux
                .map((m) => `+${m.quantity} ${NOMS_MATERIAU[m.type]}`)
                .join(" · ")}
            </p>
          )}

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
