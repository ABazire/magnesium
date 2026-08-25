"use client";

import { useState } from "react";
import { tirerGatcha } from "../../actions/gatcha";
import { personnaliserPersonnage } from "../../actions/personnalisation";
import { PersonnageIcon, StarIcon } from "@/components/pixel";
import styles from "./page.module.css";

const COUT_TIRAGE = 100;
const NB_SPRITES = 3;

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
}: {
  currencyInitiale: number;
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

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Tirage</h1>

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
              ? "Tirage en cours..."
              : `Tirer (${COUT_TIRAGE} monnaie)`}
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
          <span className={styles.resultLabel} style={{ color: couleurRarete }}>
            Nouveau personnage obtenu
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
    </main>
  );
}
