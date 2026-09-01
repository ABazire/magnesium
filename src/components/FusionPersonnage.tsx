"use client";

import { useState, useEffect } from "react";
import {
  renvoyerPersonnage,
  fusionnerPersonnage,
  getFragments,
} from "@/app/actions/fusion";
import { SEUILS_FUSION, coutFusionPersonnage } from "@/lib/fusion";
import styles from "./FusionPersonnage.module.css";

export default function FusionPersonnage({
  personnageId,
  stars,
  onFusion,
  onRenvoi,
}: {
  personnageId: string;
  stars: number;
  onFusion: () => void;
  onRenvoi: () => void;
}) {
  const [fragments, setFragments] = useState<number | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    getFragments()
      .then((f) => {
        if (!annule) setFragments(f[stars] ?? 0);
      })
      .catch((e) => {
        if (!annule) {
          setErreur(e instanceof Error ? e.message : "Erreur inconnue");
        }
      });
    return () => {
      annule = true;
    };
  }, [stars, personnageId]);

  const seuil = SEUILS_FUSION[stars] ?? null;
  const cout = coutFusionPersonnage(stars);

  async function fusionner() {
    setErreur(null);
    setEnCours(true);
    try {
      await fusionnerPersonnage(personnageId);
      onFusion();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setEnCours(false);
    }
  }

  async function renvoyer() {
    if (
      !window.confirm(
        "Renvoyer ce personnage ? Il sera définitivement perdu, en échange d'un fragment.",
      )
    ) {
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      await renvoyerPersonnage(personnageId);
      onRenvoi();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setEnCours(false);
    }
  }

  return (
    <div className={styles.bloc}>
      {erreur && <p className={styles.erreur}>{erreur}</p>}

      {seuil ? (
        <>
          <span className={styles.info}>
            {fragments ?? "…"}/{seuil} fragments {stars}★ · {cout} or
          </span>
          <button
            onClick={fusionner}
            disabled={enCours || fragments === null || fragments < seuil}
            className={styles.fusionButton}
          >
            Fusionner → {stars + 1}★
          </button>
        </>
      ) : (
        <span className={styles.info}>Palier maximal atteint</span>
      )}

      <button
        onClick={renvoyer}
        disabled={enCours}
        className={styles.renvoyerButton}
      >
        Renvoyer (+1 fragment {stars}★)
      </button>
    </div>
  );
}
