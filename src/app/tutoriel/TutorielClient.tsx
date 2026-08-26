"use client";

import { useState } from "react";
import { terminerTutoriel } from "../actions/tutoriel";
import { PersonnageIcon } from "@/components/pixel";
import styles from "./page.module.css";

const DIALOGUE = [
  "Bienvenue dans l'arène, jeune recrue ! Je suis ton guide, et je vais t'expliquer les bases.",
  "Ici, tu vas recruter des personnages, les faire progresser, et les envoyer combattre.",
  "L'Aventure te permet d'affronter des monstres pour gagner de la monnaie et de l'équipement.",
  "L'Arène te permet d'affronter d'autres joueurs, en 1v1 ou en équipe de 3, pour grimper dans le classement.",
  "Avant de commencer, voici un premier personnage et une arme pour t'accompagner. Bonne chance !",
];

export default function TutorielClient() {
  const [etape, setEtape] = useState(0);
  const [enCours, setEnCours] = useState(false);

  const dernierEtape = etape === DIALOGUE.length - 1;

  async function terminer() {
    setEnCours(true);
    await terminerTutoriel();
  }

  return (
    <main className={styles.page}>
      <div className={styles.mascotWrapper}>
        <PersonnageIcon size={120} couleur="#f2c94c" variant={2} />
      </div>

      <div className={styles.bubble}>
        <p className={styles.bubbleText}>{DIALOGUE[etape]}</p>
      </div>

      <div className={styles.progress}>
        {DIALOGUE.map((_, i) => (
          <span
            key={i}
            className={i === etape ? styles.dotActive : styles.dot}
          />
        ))}
      </div>

      {!dernierEtape ? (
        <button
          onClick={() => setEtape((e) => e + 1)}
          className={styles.nextButton}
        >
          Suivant
        </button>
      ) : (
        <button
          onClick={terminer}
          className={styles.nextButton}
          disabled={enCours}
        >
          {enCours ? "Préparation..." : "Commencer l'aventure"}
        </button>
      )}
    </main>
  );
}
