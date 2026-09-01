"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { fusionnerObjets } from "@/app/actions/fusion";
import { SEUILS_FUSION, coutFusionObjet } from "@/lib/fusion";
import { RECETTES_FUSION_EQUIPEMENT } from "@/lib/craft";
import { NOMS_MATERIAU } from "@/lib/monsterDrops";
import { SwordIcon, ArmorIcon, BootsIcon, AmuletIcon } from "@/components/pixel";
import type { EquipmentSlot } from "@prisma/client";
import styles from "./FusionEquipement.module.css";

const ICONE_SLOT: Record<EquipmentSlot, ComponentType<{ size?: number }>> = {
  ARME: SwordIcon,
  ARMURE: ArmorIcon,
  BOTTES: BootsIcon,
  AMULETTE: AmuletIcon,
};

type Groupe = { slot: EquipmentSlot; stars: number; ids: string[] };

export default function FusionEquipement({ groupes }: { groupes: Groupe[] }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  if (groupes.length === 0) return null;

  async function fusionner(groupe: Groupe) {
    const seuil = SEUILS_FUSION[groupe.stars];
    const cle = `${groupe.slot}-${groupe.stars}`;
    setErreur(null);
    setEnCours(cle);
    try {
      await fusionnerObjets(groupe.ids.slice(0, seuil));
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className={styles.section}>
      <span className={styles.label}>Fusion disponible</span>
      {erreur && <p className={styles.erreur}>{erreur}</p>}
      <div className={styles.grid}>
        {groupes.map((g) => {
          const seuil = SEUILS_FUSION[g.stars];
          const recette = RECETTES_FUSION_EQUIPEMENT[g.slot];
          const cout = coutFusionObjet(g.stars);
          const Icone = ICONE_SLOT[g.slot];
          const cle = `${g.slot}-${g.stars}`;

          return (
            <div key={cle} className={styles.carte}>
              <Icone size={32} />
              <span className={styles.titre}>
                {g.slot} {g.stars}★
              </span>
              <span className={styles.stock}>{g.ids.length} en stock</span>
              <span className={styles.recette}>
                {seuil} objets +{" "}
                {recette.materiaux
                  .map((m) => `${m.quantity} ${NOMS_MATERIAU[m.type]}`)
                  .join(" + ")}{" "}
                + {cout} or
              </span>
              <button
                onClick={() => fusionner(g)}
                disabled={enCours !== null}
                className={styles.bouton}
              >
                {enCours === cle ? "..." : `Fusionner → ${g.stars + 1}★`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
