import type { CombatEvent3v3 } from "@/lib/combatEquipe";
import {
  EFFET_COUP,
  PALETTE_COUP,
  EFFET_IMPACT,
  PALETTE_IMPACT,
  EFFET_SOIN,
  PALETTE_SOIN,
  EFFET_ETOURDI,
  PALETTE_ETOURDI,
  EFFET_FLAMME,
  PALETTE_FLAMME,
  EFFET_GIVRE,
  PALETTE_GIVRE,
  EFFET_FOUDRE,
  PALETTE_FOUDRE,
} from "./pixel/animations";

/**
 * Lecture des événements de combat, partagée par les trois visualiseurs
 * (1v1, 3v3 et aventure).
 *
 * Les trois affichaient auparavant leur propre copie de ces fonctions. Comme
 * le moteur est commun, l'interprétation de ses événements l'est aussi :
 * ajouter un effet ne demande plus de le brancher à trois endroits.
 */

/**
 * Qui agit, et sur qui — sert à animer le bon sprite.
 *
 * Un K.O. n'a pas d'acteur : c'est une conséquence, pas une action. Les deux
 * champs sont donc optionnels.
 */
export function acteurCible(ev: CombatEvent3v3): {
  acteur?: string;
  cible?: string;
} {
  switch (ev.type) {
    case "dodge":
    case "hit":
    case "spellDegats":
      return { acteur: ev.attackerId, cible: ev.defenderId };
    case "spellSoin":
      return { acteur: ev.casterId, cible: ev.casterId };
    case "spellEtourdissement":
    case "spellRalentissement":
      return { acteur: ev.casterId, cible: ev.targetId };
    case "epines":
      // C'est le défenseur qui riposte : c'est lui l'acteur du renvoi.
      return { acteur: ev.defenderId, cible: ev.attackerId };
    case "brulure":
    case "regeneration":
    case "volDeVie":
    case "stun":
      return { acteur: ev.personnageId };
    case "ko":
      return { cible: ev.personnageId };
  }
}

/** Événements qui doivent jouer l'animation d'incantation. */
export function estSort(ev: CombatEvent3v3): boolean {
  return (
    ev.type === "spellDegats" ||
    ev.type === "spellSoin" ||
    ev.type === "spellEtourdissement" ||
    ev.type === "spellRalentissement"
  );
}

/** Événements qui secouent la scène (un coup a porté). */
export function estImpact(ev: CombatEvent3v3): boolean {
  return ev.type === "hit" || ev.type === "spellDegats" || ev.type === "epines";
}

/**
 * Reporte un événement sur les jauges de vie et de mana.
 *
 * Les objets sont modifiés sur place : les visualiseurs rejouent tous les
 * événements depuis le début à chaque rendu, c'est le plus simple pour pouvoir
 * revenir en arrière ou passer l'animation.
 */
export function appliquerEvenement(
  vie: Record<string, number>,
  mana: Record<string, number>,
  ev: CombatEvent3v3,
): void {
  switch (ev.type) {
    case "hit":
    case "spellDegats":
      vie[ev.defenderId] = ev.defenderHpAfter;
      break;
    case "spellSoin":
      vie[ev.casterId] = ev.casterHpAfter;
      break;
    case "brulure":
    case "regeneration":
    case "volDeVie":
      vie[ev.personnageId] = ev.hpAfter;
      break;
    case "epines":
      vie[ev.attackerId] = ev.attackerHpAfter;
      break;
    case "dodge":
    case "spellEtourdissement":
    case "spellRalentissement":
    case "stun":
    case "ko":
      break;
  }

  // Le mana n'est porté que par les événements où le combattant agit.
  if ("manaApres" in ev) {
    const { acteur } = acteurCible(ev);
    if (acteur !== undefined && acteur in mana) mana[acteur] = ev.manaApres;
  }
}

/** Libellé court pour le journal de combat. */
export function libelleEvenement(
  ev: CombatEvent3v3,
  nom: (id: string) => string,
): string {
  switch (ev.type) {
    case "hit":
      return ev.critique
        ? `${nom(ev.attackerId)} frappe — CRITIQUE ${ev.damage}`
        : `${nom(ev.attackerId)} inflige ${ev.damage}`;
    case "dodge":
      return `${nom(ev.defenderId)} esquive`;
    case "spellDegats":
      return ev.critique
        ? `${ev.spellName} — CRITIQUE ${ev.damage}`
        : `${ev.spellName} — ${ev.damage} dégâts`;
    case "spellSoin":
      return `${ev.spellName} — ${nom(ev.casterId)} récupère ${ev.heal} PV`;
    case "spellEtourdissement":
      return `${ev.spellName} — ${nom(ev.targetId)} est étourdi`;
    case "spellRalentissement":
      return `${ev.spellName} — ${nom(ev.targetId)} ralenti de ${ev.pourcentage}%`;
    case "brulure":
      return `${nom(ev.personnageId)} brûle — ${ev.damage} dégâts`;
    case "regeneration":
      return `${nom(ev.personnageId)} régénère ${ev.heal} PV`;
    case "volDeVie":
      return `${nom(ev.personnageId)} draine ${ev.heal} PV`;
    case "epines":
      return `Épines — ${ev.damage} renvoyés à ${nom(ev.attackerId)}`;
    case "stun":
      return `${nom(ev.personnageId)} ne peut pas agir`;
    case "ko":
      return `${nom(ev.personnageId)} est K.O.`;
  }
}

/* ==========================================================================
   Choix de l'effet visuel
   Une seule table pour les trois visualiseurs : ils n'apportent que la
   taille d'affichage, qui dépend de leur mise en page.
   ========================================================================== */

export type EffetVisuel = {
  frames: string[][];
  palette: Record<string, string>;
};

const PAR_ELEMENT: Record<string, EffetVisuel> = {
  FEU: { frames: EFFET_FLAMME, palette: PALETTE_FLAMME },
  GLACE: { frames: EFFET_GIVRE, palette: PALETTE_GIVRE },
  FOUDRE: { frames: EFFET_FOUDRE, palette: PALETTE_FOUDRE },
};

/**
 * Effet à jouer sur la cible d'un événement.
 *
 * Les sorts offensifs prennent l'apparence de leur élément : une lame ardente
 * fait jaillir des flammes, un arc électrique des éclairs. Le reste retombe
 * sur l'impact générique.
 */
export function effetVisuel(ev: CombatEvent3v3): EffetVisuel | null {
  switch (ev.type) {
    case "hit":
      return { frames: EFFET_COUP, palette: PALETTE_COUP };
    case "spellDegats":
      return (
        PAR_ELEMENT[ev.element ?? ""] ?? {
          frames: EFFET_IMPACT,
          palette: PALETTE_IMPACT,
        }
      );
    case "spellSoin":
    case "regeneration":
    case "volDeVie":
      return { frames: EFFET_SOIN, palette: PALETTE_SOIN };
    case "spellEtourdissement":
      return { frames: EFFET_ETOURDI, palette: PALETTE_ETOURDI };
    case "spellRalentissement":
      return { frames: EFFET_GIVRE, palette: PALETTE_GIVRE };
    case "brulure":
      return { frames: EFFET_FLAMME, palette: PALETTE_FLAMME };
    case "epines":
      return { frames: EFFET_IMPACT, palette: PALETTE_IMPACT };
    default:
      return null;
  }
}
