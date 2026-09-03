import { prisma } from "@/lib/prisma";
import { ENERGY_MAX } from "@/lib/energyConstants";
import { obtenirEnergieActuelle } from "@/lib/energy";

/**
 * Quêtes quotidiennes et récompense de connexion.
 *
 * Le catalogue vit ici, en code : la table QuestProgress ne garde que l'état
 * (progrès, réclamé) pour une clé de quête et un jour donnés. Changer une
 * cible ou une récompense ne demande donc pas de migration.
 */

function jourCourant(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export type DeclencheurQuete =
  | "VICTOIRE_AVENTURE"
  | "VICTOIRE_ARENE"
  | "INVOCATION"
  | "FABRICATION";

type Recompense = { or?: number; diamants?: number; energie?: number };

type DefinitionQuete = {
  cle: string;
  label: string;
  declencheur: DeclencheurQuete;
  cible: number;
  recompense: Recompense;
};

export const QUETES_DU_JOUR: DefinitionQuete[] = [
  {
    cle: "aventure3",
    label: "Remporte 3 combats d'aventure",
    declencheur: "VICTOIRE_AVENTURE",
    cible: 3,
    recompense: { or: 80 },
  },
  {
    cle: "arene1",
    label: "Remporte 1 combat en arène (1v1 ou 3v3)",
    declencheur: "VICTOIRE_ARENE",
    cible: 1,
    recompense: { or: 60, diamants: 2 },
  },
  {
    cle: "invocation1",
    label: "Recrute 1 personnage ou objet",
    declencheur: "INVOCATION",
    cible: 1,
    recompense: { energie: 60 },
  },
  {
    cle: "fabrication1",
    label: "Fabrique ou fusionne un équipement",
    declencheur: "FABRICATION",
    cible: 1,
    recompense: { or: 50 },
  },
];

/**
 * Récompense de connexion : elle suit un cycle de 7 jours plutôt qu'une
 * table de quête statique, pour que la récompense grossisse visiblement
 * avec le streak sans dupliquer une définition par palier.
 */
const PALIERS_CONNEXION: Recompense[] = [
  { or: 30 },
  { or: 40 },
  { or: 50 },
  { or: 60 },
  { or: 80 },
  { or: 100 },
  { or: 150, diamants: 5 },
];

function recompenseConnexion(streak: number): Recompense {
  const palier = ((Math.max(1, streak) - 1) % PALIERS_CONNEXION.length) + 1;
  return PALIERS_CONNEXION[palier - 1];
}

/**
 * À appeler une fois par requête authentifiée (dans le layout du jeu).
 *
 * N'écrit en base que si le jour a changé, pour ne pas taper la base à
 * chaque navigation. Un jour manqué casse le streak ; le jour même ne
 * l'incrémente qu'une fois.
 */
export async function enregistrerConnexionQuotidienne(userId: string) {
  const jour = jourCourant();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.lastLoginJour === jour) return;

  const hier = new Date();
  hier.setUTCDate(hier.getUTCDate() - 1);
  const jourHier = `${hier.getUTCFullYear()}-${String(hier.getUTCMonth() + 1).padStart(2, "0")}-${String(hier.getUTCDate()).padStart(2, "0")}`;

  const streak = user.lastLoginJour === jourHier ? user.loginStreak + 1 : 1;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { lastLoginJour: jour, loginStreak: streak },
    }),
    prisma.questProgress.upsert({
      where: { ownerId_jour_cle: { ownerId: userId, jour, cle: "connexion" } },
      create: { ownerId: userId, jour, cle: "connexion", progres: 1 },
      update: { progres: 1 },
    }),
  ]);
}

/** Incrémente le progrès de toutes les quêtes du jour déclenchées par cet événement. */
export async function progresserQuete(
  userId: string,
  declencheur: DeclencheurQuete,
  montant = 1,
) {
  const jour = jourCourant();
  const definitions = QUETES_DU_JOUR.filter(
    (q) => q.declencheur === declencheur,
  );

  for (const def of definitions) {
    await prisma.questProgress.upsert({
      where: { ownerId_jour_cle: { ownerId: userId, jour, cle: def.cle } },
      create: { ownerId: userId, jour, cle: def.cle, progres: montant },
      update: { progres: { increment: montant } },
    });
  }
}

export type QueteAffichee = {
  cle: string;
  label: string;
  cible: number;
  progres: number;
  reclame: boolean;
  complete: boolean;
  recompense: Recompense;
};

export async function getQuetesDuJour(userId: string): Promise<{
  quetes: QueteAffichee[];
  connexion: QueteAffichee;
  streak: number;
}> {
  const jour = jourCourant();
  const [lignes, user] = await Promise.all([
    prisma.questProgress.findMany({ where: { ownerId: userId, jour } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);
  const parCle = new Map(lignes.map((l) => [l.cle, l]));

  const quetes = QUETES_DU_JOUR.map((def) => {
    const ligne = parCle.get(def.cle);
    const progres = Math.min(ligne?.progres ?? 0, def.cible);
    return {
      cle: def.cle,
      label: def.label,
      cible: def.cible,
      progres,
      reclame: ligne?.reclame ?? false,
      complete: progres >= def.cible,
      recompense: def.recompense,
    };
  });

  const ligneConnexion = parCle.get("connexion");
  const connexion: QueteAffichee = {
    cle: "connexion",
    label: `Connexion — jour ${((user.loginStreak - 1) % 7) + 1}/7`,
    cible: 1,
    progres: ligneConnexion?.progres ?? 0,
    reclame: ligneConnexion?.reclame ?? false,
    complete: (ligneConnexion?.progres ?? 0) >= 1,
    recompense: recompenseConnexion(user.loginStreak),
  };

  return { quetes, connexion, streak: user.loginStreak };
}

export async function reclamerRecompenseQuete(userId: string, cle: string) {
  const jour = jourCourant();

  const estConnexion = cle === "connexion";
  const def = QUETES_DU_JOUR.find((q) => q.cle === cle);
  if (!estConnexion && !def) throw new Error("Quête inconnue");

  const ligne = await prisma.questProgress.findUnique({
    where: { ownerId_jour_cle: { ownerId: userId, jour, cle } },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const cible = estConnexion ? 1 : def!.cible;
  const progres = Math.min(ligne?.progres ?? 0, cible);

  if (progres < cible) throw new Error("Quête pas encore terminée");
  if (ligne?.reclame) throw new Error("Récompense déjà réclamée");

  const recompense = estConnexion
    ? recompenseConnexion(user.loginStreak)
    : def!.recompense;

  // L'énergie passe par le calcul de régénération avant d'ajouter le gain,
  // sinon un incrément brut au-delà du plafond serait silencieusement
  // écrasé (et donc perdu) à la prochaine lecture.
  let energieApres: number | undefined;
  if (recompense.energie) {
    const actuelle = await obtenirEnergieActuelle(userId);
    energieApres = Math.min(ENERGY_MAX, actuelle + recompense.energie);
  }

  await prisma.$transaction([
    prisma.questProgress.update({
      where: { id: ligne!.id },
      data: { reclame: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        ...(recompense.or ? { currency: { increment: recompense.or } } : {}),
        ...(recompense.diamants
          ? { diamonds: { increment: recompense.diamants } }
          : {}),
        ...(energieApres !== undefined
          ? { energy: energieApres, energyUpdatedAt: new Date() }
          : {}),
      },
    }),
  ]);

  return recompense;
}
