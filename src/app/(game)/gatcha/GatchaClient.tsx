"use client";

import { useState } from "react";
import { tirerGatcha, tirerGatchaPremium } from "../../actions/gatcha";
import { personnaliserPersonnage } from "../../actions/personnalisation";
import { PersonnageIcon, StarIcon } from "@/components/pixel";
import styles from "./page.module.css";
import { DiamondIcon } from "@/components/pixel";

const COUT_TIRAGE = 100;
const NB_SPRITES = 8;

const RARITY_COLORS: Record<number, string> = {
  1: "#9db3aa",
  2: "#7fd9c4",
  3: "#5cc8ff",
  4: "#c792ea",
  5: "#ff9d81",
  6: "#f2c94c",
};

const COULEURS_CHOIX = [
  "#10b981",
  "#ef4444",
  "#5cc8ff",
  "#c792ea",
  "#f2c94c",
  "#ff9d81",
];

type Resultat = {
  id: string;
  name: string;
  stars: number;
  vie: number;
  force: number;
  vitesse: number;
  resistance: number;
  agilite: number;
};

export default function GatchaClient({
  currencyInitiale,
  diamondsInitiaux,
}: {
  currencyInitiale: number;
  diamondsInitiaux: number;
}) {
  const [phase, setPhase] = useState<"idle" | "tirage" | "reveal">("idle");
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [currency, setCurrency] = useState(currencyInitiale);
  const [erreur, setErreur] = useState<string | null>(null);

  const [nomChoisi, setNomChoisi] = useState("");
  const [spriteChoisi, setSpriteChoisi] = useState(0);
  const [couleurChoisie, setCouleurChoisie] = useState("#10b981");
  const [enregistrement, setEnregistrement] = useState(false);

  async function tirer() {
    if (currency < COUT_TIRAGE || phase !== "idle") return;
    setErreur(null);
    setPhase("tirage");

    try {
      const res = await tirerGatcha();
      setCurrency(res.newCurrency);
      setTimeout(() => {
        setResultat(res.personnage);
        setNomChoisi(res.personnage.name);
        setSpriteChoisi(0);
        setCouleurChoisie("#10b981");
        setPhase("reveal");
      }, 1300);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setPhase("idle");
    }
  }

  function spritePrecedent() {
    setSpriteChoisi((s) => (s - 1 + NB_SPRITES) % NB_SPRITES);
  }
  function spriteSuivant() {
    setSpriteChoisi((s) => (s + 1) % NB_SPRITES);
  }

  async function confirmer() {
    if (!resultat) return;
    setEnregistrement(true);
    try {
      await personnaliserPersonnage(
        resultat.id,
        nomChoisi,
        spriteChoisi,
        couleurChoisie,
      );
      setPhase("idle");
      setResultat(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setEnregistrement(false);
    }
  }

  const couleurRarete = resultat ? RARITY_COLORS[resultat.stars] : "#f2c94c";

  const [diamonds, setDiamonds] = useState(diamondsInitiaux);
  const [phasePremium, setPhasePremium] = useState<
    "idle" | "tirage" | "reveal"
  >("idle");
  const [resultatPremium, setResultatPremium] = useState<Resultat | null>(null);

  async function tirerPremium() {
    if (diamonds < 1 || phasePremium !== "idle") return;
    setErreur(null);
    setPhasePremium("tirage");

    try {
      const res = await tirerGatchaPremium();
      setDiamonds(res.newDiamonds);
      setTimeout(() => {
        setResultatPremium(res.personnage);
        setNomChoisi(res.personnage.name);
        setSpriteChoisi(0);
        setCouleurChoisie("#10b981");
        setPhasePremium("reveal");
      }, 1300);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setPhasePremium("idle");
    }
  }

  async function confirmerPersonnalisationPremium() {
    if (!resultatPremium) return;
    setEnregistrement(true);
    try {
      await personnaliserPersonnage(
        resultatPremium.id,
        nomChoisi,
        spriteChoisi,
        couleurChoisie,
      );
      setPhasePremium("idle");
      setResultatPremium(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Recrutement</h1>
      <div className={styles.panel}>
        <p className={styles.currency}>
          Monnaie : <span className={styles.currencyValue}>{currency}</span>
        </p>
        {erreur && <p className={styles.error}>{erreur}</p>}
        {phase !== "reveal" && (
          <>
            <div
              className={`${styles.orb} ${phase === "tirage" ? styles.orbActive : ""}`}
            >
              <StarIcon size={40} />
            </div>
            <button
              onClick={tirer}
              className={styles.pullButton}
              disabled={currency < COUT_TIRAGE || phase === "tirage"}
            >
              {phase === "tirage"
                ? "Recrutement en cours..."
                : `Recruter (${COUT_TIRAGE} monnaie)`}
            </button>
          </>
        )}
        {phase === "reveal" && resultat && (
          <div
            className={styles.resultCard}
            style={{
              borderColor: couleurRarete,
              boxShadow: `0 0 30px ${couleurRarete}44`,
            }}
          >
            <span
              className={styles.resultLabel}
              style={{ color: couleurRarete }}
            >
              Nouveau personnage recruté{" "}
            </span>

            <div className={styles.spriteNav}>
              <button onClick={spritePrecedent} className={styles.navArrow}>
                ◄
              </button>
              <PersonnageIcon
                size={80}
                couleur={couleurChoisie}
                variant={spriteChoisi}
              />
              <button onClick={spriteSuivant} className={styles.navArrow}>
                ►
              </button>
            </div>

            <input
              value={nomChoisi}
              onChange={(e) => setNomChoisi(e.target.value)}
              maxLength={20}
              className={styles.nameInput}
            />

            <div className={styles.colorRow}>
              {COULEURS_CHOIX.map((c) => (
                <button
                  key={c}
                  onClick={() => setCouleurChoisie(c)}
                  className={`${styles.colorSwatch} ${couleurChoisie === c ? styles.colorSwatchActive : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <span className={styles.resultStars}>
              {"★".repeat(resultat.stars)}
            </span>

            <div className={styles.resultStats}>
              <span>Vie {resultat.vie}</span>
              <span>Force {resultat.force}</span>
              <span>Vitesse {resultat.vitesse}</span>
              <span>Résistance {resultat.resistance}</span>
              <span>Agilité {resultat.agilite}</span>
            </div>

            <button
              onClick={confirmer}
              className={styles.pullButton}
              disabled={enregistrement}
            >
              {enregistrement ? "Enregistrement..." : "Confirmer"}
            </button>
          </div>
        )}
        <div className={styles.sectionDivider} />
        <h2 className={styles.sectionTitle}>Recrutement premium</h2>{" "}
        <p className={styles.currency}>
          <DiamondIcon size={18} /> Diamants :{" "}
          <span className={styles.currencyValue}>{diamonds}</span>
        </p>
        {phasePremium !== "reveal" && (
          <>
            <div
              className={`${styles.orb} ${styles.orbPremium} ${phasePremium === "tirage" ? styles.orbActive : ""}`}
            >
              <DiamondIcon size={40} />
            </div>
            <button
              onClick={tirerPremium}
              className={styles.pullButtonPremium}
              disabled={diamonds < 1 || phasePremium === "tirage"}
            >
              {phasePremium === "tirage"
                ? "Recrutement en cours..."
                : "Recruter (1 diamant, 3★ garanti)"}
            </button>
          </>
        )}
        {phasePremium === "reveal" && resultatPremium && (
          <div
            className={styles.resultCard}
            style={{
              borderColor: RARITY_COLORS[resultatPremium.stars],
              boxShadow: `0 0 30px ${RARITY_COLORS[resultatPremium.stars]}44`,
            }}
          >
            <span
              className={styles.resultLabel}
              style={{ color: RARITY_COLORS[resultatPremium.stars] }}
            >
              Nouveau personnage recruté{" "}
            </span>

            <div className={styles.spriteNav}>
              <button onClick={spritePrecedent} className={styles.navArrow}>
                ◄
              </button>
              <PersonnageIcon
                size={80}
                couleur={couleurChoisie}
                variant={spriteChoisi}
              />
              <button onClick={spriteSuivant} className={styles.navArrow}>
                ►
              </button>
            </div>

            <input
              value={nomChoisi}
              onChange={(e) => setNomChoisi(e.target.value)}
              maxLength={20}
              className={styles.nameInput}
            />

            <div className={styles.colorRow}>
              {COULEURS_CHOIX.map((c) => (
                <button
                  key={c}
                  onClick={() => setCouleurChoisie(c)}
                  className={`${styles.colorSwatch} ${couleurChoisie === c ? styles.colorSwatchActive : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <span className={styles.resultStars}>
              {"★".repeat(resultatPremium.stars)}
            </span>

            <div className={styles.resultStats}>
              <span>Vie {resultatPremium.vie}</span>
              <span>Force {resultatPremium.force}</span>
              <span>Vitesse {resultatPremium.vitesse}</span>
              <span>Résistance {resultatPremium.resistance}</span>
              <span>Agilité {resultatPremium.agilite}</span>
            </div>

            <button
              onClick={confirmerPersonnalisationPremium}
              className={styles.pullButtonPremium}
              disabled={enregistrement}
            >
              {enregistrement ? "Enregistrement..." : "Confirmer"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
