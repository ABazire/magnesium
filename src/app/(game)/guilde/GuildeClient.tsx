"use client";

import { useEffect, useState } from "react";
import {
  creerGuilde,
  rejoindreGuilde,
  quitterGuilde,
  listerGuildesDisponibles,
  getMonEtatGuilde,
  attaquerBossGuilde,
} from "@/app/actions/guilde";
import { IconePieceUI } from "@/components/pixel/IconesUI";
import styles from "./page.module.css";

type EtatGuilde = Awaited<ReturnType<typeof getMonEtatGuilde>>;
type GuildeDisponible = Awaited<ReturnType<typeof listerGuildesDisponibles>>[number];

function EcranCreation() {
  const [guildes, setGuildes] = useState<GuildeDisponible[] | null>(null);
  const [nom, setNom] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    listerGuildesDisponibles().then(setGuildes);
  }, []);

  async function creer() {
    setErreur(null);
    setEnCours(true);
    try {
      await creerGuilde(nom);
      window.location.reload();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setEnCours(false);
    }
  }

  async function rejoindre(id: string) {
    setErreur(null);
    setEnCours(true);
    try {
      await rejoindreGuilde(id);
      window.location.reload();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setEnCours(false);
    }
  }

  return (
    <div className={styles.colonnes}>
      <div className={styles.panneau}>
        <h2 className={styles.sousTitre}>Créer une guilde</h2>
        <p className={styles.info}>
          Fonde une guilde et affronte un boss coopératif avec tes futurs
          membres : chacun peut l&apos;attaquer {" "}
          <strong>3 fois par jour</strong>, les dégâts s&apos;additionnent
          dans une réserve de vie commune.
        </p>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la guilde (3-24 caractères)"
          maxLength={24}
          className={styles.input}
        />
        <button
          onClick={creer}
          disabled={enCours || nom.trim().length < 3}
          className={styles.boutonPrimaire}
        >
          Créer
        </button>
      </div>

      <div className={styles.panneau}>
        <h2 className={styles.sousTitre}>Rejoindre une guilde</h2>
        {erreur && <p className={styles.erreur}>{erreur}</p>}
        {!guildes ? (
          <p className={styles.info}>Chargement…</p>
        ) : guildes.length === 0 ? (
          <p className={styles.info}>Aucune guilde pour l&apos;instant — sois le premier.</p>
        ) : (
          <ul className={styles.listeGuildes}>
            {guildes.map((g) => (
              <li key={g.id} className={styles.ligneGuilde}>
                <span className={styles.nomGuilde}>{g.name}</span>
                <span className={styles.compteMembres}>{g.nombreMembres}/30</span>
                <button
                  onClick={() => rejoindre(g.id)}
                  disabled={enCours}
                  className={styles.boutonSecondaire}
                >
                  Rejoindre
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EcranGuilde({
  etat,
  onMaj,
}: {
  etat: NonNullable<EtatGuilde>;
  onMaj: () => void;
}) {
  const [enCours, setEnCours] = useState(false);
  const [journal, setJournal] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function attaquer() {
    setErreur(null);
    setEnCours(true);
    try {
      const res = await attaquerBossGuilde();
      setJournal(
        res.bossVaincu
          ? `${res.degats} dégâts — boss vaincu ! +${res.maRecompenseCycle} or, un nouveau boss vient d'apparaître.`
          : `${res.degats} dégâts infligés.`,
      );
      onMaj();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setEnCours(false);
    }
  }

  async function quitter() {
    if (!window.confirm(`Quitter ${etat.name} ?`)) return;
    setEnCours(true);
    try {
      await quitterGuilde();
      window.location.reload();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setEnCours(false);
    }
  }

  const pct = etat.boss ? Math.min(100, (etat.boss.vie / etat.boss.vieMax) * 100) : 0;

  return (
    <div className={styles.colonnes}>
      <div className={styles.panneau}>
        <div className={styles.enteteGuilde}>
          <h2 className={styles.sousTitre}>{etat.name}</h2>
          <button onClick={quitter} disabled={enCours} className={styles.boutonQuitter}>
            Quitter
          </button>
        </div>

        <span className={styles.sectionLabel}>Membres ({etat.membres.length}/30)</span>
        <ul className={styles.listeMembres}>
          {etat.membres.map((m) => (
            <li key={m.id} className={styles.membre}>
              {m.username}
              {m.id === etat.leaderId && <span className={styles.badgeChef}>Chef</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.panneau}>
        <h2 className={styles.sousTitre}>Boss de guilde</h2>
        {erreur && <p className={styles.erreur}>{erreur}</p>}

        {!etat.boss ? (
          <p className={styles.info}>
            Aucun boss actif — la première attaque en fait apparaître un.
          </p>
        ) : (
          <>
            <span className={styles.cycleLabel}>Cycle {etat.boss.cycle}</span>
            <div className={styles.barreBossTrack}>
              <div className={styles.barreBossFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.vieBoss}>
              {etat.boss.vie.toLocaleString("fr-FR")} / {etat.boss.vieMax.toLocaleString("fr-FR")} PV
            </span>
          </>
        )}

        {journal && <p className={styles.journal}>{journal}</p>}

        <button
          onClick={attaquer}
          disabled={enCours || etat.attaquesRestantes <= 0}
          className={styles.boutonPrimaire}
        >
          {etat.attaquesRestantes > 0
            ? `Attaquer (${etat.attaquesRestantes} restantes)`
            : "Plus d'attaques aujourd'hui"}
        </button>

        <span className={styles.sectionLabel}>Mes dégâts ce cycle</span>
        <p className={styles.mesDegats}>{etat.mesDegatsCycle.toLocaleString("fr-FR")}</p>

        {etat.classementCycle.length > 0 && (
          <>
            <span className={styles.sectionLabel}>Contributeurs</span>
            <ul className={styles.classement}>
              {etat.classementCycle.map((c, i) => (
                <li key={c.username + i} className={styles.ligneClassement}>
                  <span className={styles.rang}>{i + 1}</span>
                  <span className={styles.nomJoueur}>{c.username}</span>
                  <span className={styles.degatsJoueur}>
                    {c.degats.toLocaleString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <span className={styles.recompenseInfo}>
          <IconePieceUI size={14} /> 20 or par attaque, plus une part du butin
          proportionnelle aux dégâts quand le boss tombe.
        </span>
      </div>
    </div>
  );
}

export default function GuildeClient() {
  const [etat, setEtat] = useState<EtatGuilde | "chargement">("chargement");

  function charger() {
    getMonEtatGuilde().then(setEtat);
  }

  useEffect(() => {
    charger();
  }, []);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Guilde</h1>

      {etat === "chargement" ? (
        <p className={styles.info}>Chargement…</p>
      ) : etat === null ? (
        <EcranCreation />
      ) : (
        <EcranGuilde etat={etat} onMaj={charger} />
      )}
    </main>
  );
}
