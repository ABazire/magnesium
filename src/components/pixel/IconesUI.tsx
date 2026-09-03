import PixelSprite from "./PixelSprite";
import {
  ICONE_ACCUEIL,
  ICONE_ARENE,
  ICONE_AVENTURE,
  ICONE_CLASSEMENT,
  ICONE_ENERGIE,
  ICONE_FORGE,
  ICONE_GEMME,
  ICONE_INVENTAIRE,
  ICONE_PIECE,
  ICONE_RECRUTEMENT,
  PALETTE_ENERGIE,
  PALETTE_GEMME,
  PALETTE_PIECE,
  paletteIcone,
} from "./icones";

/**
 * Icônes en ligne (statistiques, éléments, actions), dessinées sur 8x8.
 *
 * Le format n'est pas arbitraire : à 16px, chaque pixel de la grille tombe sur
 * exactement 2 pixels d'écran, donc l'icône reste nette. Les tailles qui ne
 * sont pas des multiples de 8 restent correctes mais moins franches.
 *
 * L'API imite celle de lucide-react (`<Icone size={16} />`) pour que ces
 * composants se substituent aux anciens sans réécrire les appels, y compris là
 * où l'icône est passée comme référence dans une table.
 */

type Props = { size?: number; couleur?: string };

// La pointe penche à gauche : sans cette asymétrie, la flamme aurait
// exactement la silhouette de la goutte de mana et les deux se confondraient.
const FEU = [
  "...p....",
  "..pp....",
  "..pcp...",
  ".pccpp..",
  ".pcccpp.",
  "pccccccp",
  "pccccccp",
  ".pppppp.",
];

const GLACE = [
  "...pp...",
  "p..pp..p",
  ".p.pp.p.",
  "..pppp..",
  "pppppppp",
  "..pppp..",
  ".p.pp.p.",
  "p..pp..p",
];

const COEUR = [
  ".pp..pp.",
  "pccppccp",
  "pccccccp",
  "pccccccp",
  ".pccccp.",
  "..pccp..",
  "...pp...",
  "........",
];

const BOUCLIER = [
  "pppppppp",
  "pccccccp",
  "pccccccp",
  "pccccccp",
  ".pccccp.",
  ".pccccp.",
  "..pccp..",
  "...pp...",
];

const MAGIE = [
  "...pp...",
  "...pp...",
  "..pppp..",
  "pppppppp",
  "pppppppp",
  "..pppp..",
  "...pp...",
  "...pp...",
];

const GOUTTE = [
  "...pp...",
  "..pccp..",
  "..pccp..",
  ".pccccp.",
  "pccccccp",
  "pccccccp",
  ".pccccp.",
  "..pppp..",
];

const CAISSE = [
  "oooooooo",
  "oppccppo",
  "oppccppo",
  "occcccco",
  "occcccco",
  "oppccppo",
  "oppccppo",
  "oooooooo",
];

const PLUME = [
  "......pp",
  ".....pcp",
  "....pccp",
  "...pcccp",
  "..pcccp.",
  ".pcccp..",
  ".pccp...",
  "p.pp....",
];

const POUBELLE = [
  "...pp...",
  "pppppppp",
  ".pppppp.",
  ".p.pp.p.",
  ".p.pp.p.",
  ".p.pp.p.",
  ".p.pp.p.",
  "..pppp..",
];

const CHEVRON_GAUCHE = [
  "....pp..",
  "...pp...",
  "..pp....",
  ".pp.....",
  ".pp.....",
  "..pp....",
  "...pp...",
  "....pp..",
];

const CHEVRON_DROIT = CHEVRON_GAUCHE.map((ligne) =>
  [...ligne].reverse().join(""),
);

function fabriquer(
  grille: string[],
  palette: Record<string, string>,
  defaut = 16,
) {
  const Composant = ({ size = defaut, couleur }: Props) => (
    <PixelSprite
      grid={grille}
      palette={couleur ? paletteIcone(couleur) : palette}
      size={size}
    />
  );
  return Composant;
}

/* Éléments et statistiques : couleurs propres, elles portent du sens. */
export const IconeFeu = fabriquer(FEU, { p: "#c2410c", c: "#f2c94c" });
export const IconeGlace = fabriquer(GLACE, { p: "#7dd3fc" });
export const IconeCoeur = fabriquer(COEUR, { p: "#991b1b", c: "#ef4444" });
export const IconeMagie = fabriquer(MAGIE, { p: "#c792ea" });
export const IconeMana = fabriquer(GOUTTE, { p: "#1d4ed8", c: "#60a5fa" });
export const IconeCaisse = fabriquer(CAISSE, {
  o: "#5c4022",
  p: "#a97442",
  c: "#c79a5e",
});
export const IconePlume = fabriquer(PLUME, { p: "#7c9a90", c: "#e6f0ec" });
export const IconeGemmeUI = fabriquer(ICONE_GEMME, PALETTE_GEMME);
export const IconePieceUI = fabriquer(ICONE_PIECE, PALETTE_PIECE);
export const IconeEnergieUI = fabriquer(ICONE_ENERGIE, PALETTE_ENERGIE);

/* Actions : elles suivent la couleur du texte autour, comme le faisaient les
   icônes au trait qu'elles remplacent. */
export const IconeBouclier = fabriquer(BOUCLIER, {
  p: "currentColor",
  c: "currentColor",
});
export const IconePoubelle = fabriquer(POUBELLE, { p: "currentColor" });
export const IconeChevronGauche = fabriquer(CHEVRON_GAUCHE, {
  p: "currentColor",
});
export const IconeChevronDroit = fabriquer(CHEVRON_DROIT, {
  p: "currentColor",
});

/* Rubriques du jeu — réutilisent les grilles de la barre de navigation pour
   que le tutoriel montre exactement les icônes que le joueur retrouvera. */
const PALETTE_RUBRIQUE = paletteIcone("#f2c94c");

export const IconeRubriqueAccueil = fabriquer(ICONE_ACCUEIL, PALETTE_RUBRIQUE, 40);
export const IconeRubriqueInventaire = fabriquer(ICONE_INVENTAIRE, PALETTE_RUBRIQUE, 40);
export const IconeRubriqueAventure = fabriquer(ICONE_AVENTURE, PALETTE_RUBRIQUE, 40);
export const IconeRubriqueArene = fabriquer(ICONE_ARENE, PALETTE_RUBRIQUE, 40);
export const IconeRubriqueClassement = fabriquer(ICONE_CLASSEMENT, PALETTE_RUBRIQUE, 40);
export const IconeRubriqueRecrutement = fabriquer(ICONE_RECRUTEMENT, PALETTE_RUBRIQUE, 40);
export const IconeRubriqueForge = fabriquer(ICONE_FORGE, PALETTE_RUBRIQUE, 40);

/* --------------------------------------------------------------------------
   Effets de sorts
   -------------------------------------------------------------------------- */

const ECLAIR = [
  ".....pp.",
  "....pp..",
  "...pp...",
  "..ppppp.",
  "....pp..",
  "...pp...",
  "..pp....",
  ".pp.....",
];

const ETOURDI = [
  "..pp.pp.",
  ".p..p..p",
  ".p.ppp.p",
  "..p...p.",
  "..p...p.",
  ".p.ppp.p",
  ".p..p..p",
  "..pp.pp.",
];

const CROIX = [
  "...pp...",
  "...pp...",
  "...pp...",
  "pppppppp",
  "pppppppp",
  "...pp...",
  "...pp...",
  "...pp...",
];

const CROCS = [
  "pppppppp",
  "pccccccp",
  "pc.pp.cp",
  "pc.pp.cp",
  ".p.pp.p.",
  ".p.pp.p.",
  "..p..p..",
  "...pp...",
];

const PIQUANTS = [
  "p..p..p.",
  "pp.pp.pp",
  "pp.pp.pp",
  "pppppppp",
  "pppppppp",
  "pp.pp.pp",
  "pp.pp.pp",
  "p..p..p.",
];

const CIBLE = [
  "...pp...",
  ".pppppp.",
  ".pp..pp.",
  "pp.cc.pp",
  "pp.cc.pp",
  ".pp..pp.",
  ".pppppp.",
  "...pp...",
];

export const IconeFoudre = fabriquer(ECLAIR, { p: "#facc15" });
export const IconeEtourdi = fabriquer(ETOURDI, { p: "#c792ea" });
export const IconeRegeneration = fabriquer(CROIX, { p: "#34d399" });
export const IconeVolDeVie = fabriquer(CROCS, { p: "#991b1b", c: "#ef4444" });
export const IconeEpines = fabriquer(PIQUANTS, { p: "#7dd3fc" });
export const IconeCritique = fabriquer(CIBLE, { p: "#facc15", c: "#ef4444" });

/**
 * Icône de chaque effet de sort.
 *
 * Table unique : les pages inventaire, collection et accueil en avaient chacune
 * une copie, et les nouveaux effets n'auraient été branchés que sur l'une
 * d'elles.
 */
export const ICONE_EFFET_SORT: Record<
  string,
  (props: { size?: number; couleur?: string }) => React.ReactElement
> = {
  DEGATS: IconeMagie,
  BRULURE: IconeFeu,
  DEGATS_ZONE: IconeFoudre,
  RALENTISSEMENT: IconeGlace,
  ETOURDISSEMENT: IconeEtourdi,
  SOIN: IconeCoeur,
  BONUS_STAT: IconeMagie,
  REDUCTION_DEGATS: IconeBouclier,
  REGENERATION: IconeRegeneration,
  VOL_DE_VIE: IconeVolDeVie,
  EPINES: IconeEpines,
  CRITIQUE: IconeCritique,
};
