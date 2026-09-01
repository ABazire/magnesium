"use client";

import { useState, type ComponentType } from "react";
import { terminerTutoriel } from "../actions/tutoriel";
import { PersonnageIcon } from "@/components/pixel";
import {
  Star,
  IdCard,
  Box,
  Package,
  Hammer,
  Compass,
  Swords,
  Trophy,
} from "lucide-react";
import styles from "./page.module.css";

const ETAPES: {
  icone: ComponentType<{ size?: number }>;
  titre: string;
  texte: string;
}[] = [
  {
    icone: Star,
    titre: "Bienvenue",
    texte:
      "Bienvenue, jeune recrue ! Je suis ton guide — installe-toi, on va faire le tour du jeu ensemble avant de te lâcher dans la nature.",
  },
  {
    icone: IdCard,
    titre: "Accueil & Équipes",
    texte:
      "La page d'Accueil est le cœur du jeu : tu y formes des équipes de 3 personnages, avec des flèches pour naviguer entre elles. Ces équipes servent en Aventure, et tu peux désigner l'une d'elles comme « équipe de défense » pour l'Arène en 3v3.",
  },
  {
    icone: Box,
    titre: "Collection",
    texte:
      "Ta Collection regroupe tous tes personnages. Tu peux y consulter leurs statistiques, gérer leur équipement et leurs sorts, et les fusionner (ou les renvoyer contre des fragments) pour augmenter leur rareté.",
  },
  {
    icone: Star,
    titre: "Recrutement",
    texte:
      "Le Recrutement te permet d'obtenir de nouveaux personnages contre de la monnaie ou des diamants, avec un tirage plus rare en version premium.",
  },
  {
    icone: Package,
    titre: "Inventaire",
    texte:
      "L'Inventaire est séparé en 3 catégories pour ne pas tout mélanger : Objets (tes matériaux de craft), Équipement, et Sorts — chacun avec ses propres filtres.",
  },
  {
    icone: Hammer,
    titre: "Forge",
    texte:
      "La Forge te permet de fabriquer équipement et sorts à partir des matériaux récoltés en Aventure, plus un peu d'or. Tu peux aussi y fusionner des objets en double pour les faire monter en rareté.",
  },
  {
    icone: Compass,
    titre: "Aventure",
    texte:
      "En Aventure, tu envoies une équipe affronter des monstres (loup, ours, slime, élémentaire, griffon, serpent de cristal...) pour gagner de la monnaie, de l'expérience, des matériaux, et parfois du butin.",
  },
  {
    icone: Swords,
    titre: "Arène",
    texte:
      "L'Arène t'oppose à d'autres joueurs : en 1v1 avec un personnage au choix, ou en 3v3 avec une équipe complète contre l'équipe de défense de ton adversaire.",
  },
  {
    icone: Trophy,
    titre: "Classement",
    texte:
      "Le Classement affiche les meilleurs joueurs en 1v1 et en 3v3. Grimpe en gagnant des combats d'Arène !",
  },
  {
    icone: Star,
    titre: "À toi de jouer",
    texte:
      "Avant de commencer, voici un premier personnage, une arme, et une équipe déjà formée pour t'accompagner. Bonne chance !",
  },
];

export default function TutorielClient() {
  const [etape, setEtape] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const dernierEtape = etape === ETAPES.length - 1;
  const { icone: Icone, titre, texte } = ETAPES[etape];

  async function terminer() {
    setErreur(null);
    setEnCours(true);
    try {
      await terminerTutoriel();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setEnCours(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.mascotWrapper}>
        <PersonnageIcon size={120} couleur="#f2c94c" variant={2} />
      </div>

      <div className={styles.bubble}>
        <div className={styles.bubbleHead}>
          <Icone size={18} />
          <span className={styles.bubbleTitre}>{titre}</span>
        </div>
        <p className={styles.bubbleText}>{texte}</p>
      </div>

      {erreur && <p className={styles.erreur}>{erreur}</p>}

      <div className={styles.progress}>
        {ETAPES.map((_, i) => (
          <span
            key={i}
            className={i === etape ? styles.dotActive : styles.dot}
          />
        ))}
      </div>

      <div className={styles.actions}>
        {etape > 0 && !dernierEtape && (
          <button
            onClick={() => setEtape((e) => e - 1)}
            className={styles.prevButton}
          >
            Précédent
          </button>
        )}

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
      </div>
    </main>
  );
}
