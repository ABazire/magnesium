import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ComponentType } from "react";
import {
  SwordIcon,
  ArmorIcon,
  BootsIcon,
  AmuletIcon,
  ChestIcon,
} from "@/components/pixel";
import { desequiperObjet } from "../../actions/equiper";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import FusionEquipement from "@/components/FusionEquipement";
import { NOMS_MATERIAU } from "@/lib/monsterDrops";
import { SEUILS_FUSION } from "@/lib/fusion";
import styles from "./page.module.css";
import type { Prisma, EquipmentSlot } from "@prisma/client";

type EquipementAvecRelations = Prisma.EquipmentGetPayload<{
  include: { rarity: true; equippedOn: { include: { personnage: true } } };
}>;

const PAR_PAGE = 24;

const ICONE_SLOT: Record<string, ComponentType<{ size?: number }>> = {
  ARME: SwordIcon,
  ARMURE: ArmorIcon,
  BOTTES: BootsIcon,
  AMULETTE: AmuletIcon,
};

const RARITY_COLORS: Record<number, string> = {
  1: "#9db3aa",
  2: "#7fd9c4",
  3: "#5cc8ff",
  4: "#c792ea",
  5: "#ff9d81",
  6: "#f2c94c",
};

const SLOTS = ["ARME", "ARMURE", "BOTTES", "AMULETTE"];

const STATUT_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "equipe", label: "Équipé" },
  { value: "libre", label: "Disponible" },
];

const STATS_BONUS = [
  { value: "", label: "Toutes" },
  { value: "FORCE", label: "Force" },
  { value: "VITESSE", label: "Vitesse" },
  { value: "RESISTANCE", label: "Résistance" },
  { value: "AGILITE", label: "Agilité" },
];

const CHAMPS_TRI = [
  { value: "stars", label: "Étoiles" },
  { value: "bonus", label: "Bonus" },
] as const;

type ChampTri = (typeof CHAMPS_TRI)[number]["value"];

const TRI_OPTIONS = [
  { value: "", label: "Tri : aucun" },
  ...CHAMPS_TRI.flatMap((c) => [
    { value: `${c.value}-desc`, label: `${c.label} ↓` },
    { value: `${c.value}-asc`, label: `${c.label} ↑` },
  ]),
];

function valeurTri(e: EquipementAvecRelations, champ: ChampTri): number {
  if (champ === "stars") return e.rarity?.stars ?? 0;
  return e.bonusValue;
}

export default async function InventairePage({
  searchParams,
}: {
  searchParams: Promise<{
    minStars?: string;
    slot?: string;
    statut?: string;
    bonusStat?: string;
    tri?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { minStars, slot, statut, bonusStat, tri, q, page } =
    await searchParams;
  const minStarsNum = minStars ? Number(minStars) : 0;
  const pageActuelle = page ? Math.max(1, Number(page)) : 1;

  let champTri: ChampTri | null = null;
  let sensTri: "asc" | "desc" = "desc";
  if (tri) {
    const [champ, sens] = tri.split("-");
    if (CHAMPS_TRI.some((c) => c.value === champ)) {
      champTri = champ as ChampTri;
      sensTri = sens === "asc" ? "asc" : "desc";
    }
  }

  const [tousLesEquipements, materiaux] = await Promise.all([
    prisma.equipment.findMany({
      where: { ownerId: session.user.id },
      orderBy: { id: "desc" },
      include: { rarity: true, equippedOn: { include: { personnage: true } } },
    }),
    prisma.materialStack.findMany({
      where: { ownerId: session.user.id },
      orderBy: { type: "asc" },
    }),
  ]);

  const groupesFusion = new Map<
    string,
    { slot: EquipmentSlot; stars: number; ids: string[] }
  >();
  for (const e of tousLesEquipements) {
    if (e.equippedOn) continue;
    const stars = e.rarity?.stars ?? 0;
    if (!SEUILS_FUSION[stars]) continue;
    const key = `${e.slot}-${stars}`;
    if (!groupesFusion.has(key)) {
      groupesFusion.set(key, { slot: e.slot, stars, ids: [] });
    }
    groupesFusion.get(key)!.ids.push(e.id);
  }
  const groupesFusables = [...groupesFusion.values()].filter(
    (g) => g.ids.length >= SEUILS_FUSION[g.stars],
  );

  let filtres = tousLesEquipements.filter(
    (e) => (e.rarity?.stars ?? 0) >= minStarsNum,
  );
  if (slot) filtres = filtres.filter((e) => e.slot === slot);
  if (statut === "equipe") filtres = filtres.filter((e) => !!e.equippedOn);
  if (statut === "libre") filtres = filtres.filter((e) => !e.equippedOn);
  if (bonusStat) filtres = filtres.filter((e) => e.bonusStat === bonusStat);

  if (q) {
    const qLower = q.toLowerCase();
    filtres = filtres.filter((e) => e.name.toLowerCase().includes(qLower));
  }

  if (champTri) {
    const facteur = sensTri === "asc" ? 1 : -1;
    const champ = champTri;
    filtres = [...filtres].sort(
      (a, b) => (valeurTri(a, champ) - valeurTri(b, champ)) * facteur,
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const debut = (pageActuelle - 1) * PAR_PAGE;
  const equipementsPage = filtres.slice(debut, debut + PAR_PAGE);

  const COLONNES = 8;
  const cellulesVides =
    (COLONNES - (equipementsPage.length % COLONNES)) % COLONNES;

  function construireLien(params: Record<string, string | number>) {
    const qs = new URLSearchParams({
      minStars: String(minStarsNum),
      ...(slot ? { slot } : {}),
      ...(statut ? { statut } : {}),
      ...(bonusStat ? { bonusStat } : {}),
      ...(tri ? { tri } : {}),
      ...(q ? { q } : {}),
      page: String(pageActuelle),
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    });
    return `/inventaire?${qs.toString()}`;
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Inventaire</h1>

      {materiaux.length > 0 && (
        <div className={styles.materiaux}>
          {materiaux.map((m) => (
            <span key={m.type} className={styles.materiauBadge}>
              {NOMS_MATERIAU[m.type]} × {m.quantity}
            </span>
          ))}
        </div>
      )}

      <FusionEquipement groupes={groupesFusables} />

      <FilterBar
        action="/inventaire"
        fields={[
          {
            name: "minStars",
            label: "Étoiles min.",
            value: String(minStarsNum),
            options: [0, 1, 2, 3, 4, 5, 6].map((n) => ({
              value: String(n),
              label: n === 0 ? "Toutes" : `${n}★+`,
            })),
          },
          {
            name: "slot",
            label: "Emplacement",
            value: slot ?? "",
            options: [
              { value: "", label: "Tous" },
              ...SLOTS.map((s) => ({ value: s, label: s })),
            ],
          },
          {
            name: "statut",
            label: "Statut",
            value: statut ?? "",
            options: STATUT_OPTIONS,
          },
          {
            name: "bonusStat",
            label: "Bonus",
            value: bonusStat ?? "",
            options: STATS_BONUS,
          },
          {
            name: "tri",
            label: "Trier par",
            value: tri ?? "",
            options: TRI_OPTIONS,
          },
        ]}
        search={{
          name: "q",
          value: q,
          placeholder: "Nom de l'objet...",
        }}
      />

      {filtres.length === 0 ? (
        <p className={styles.empty}>
          Aucun équipement ne correspond à ces filtres.
        </p>
      ) : (
        <div className={styles.grid}>
          {equipementsPage.map((e) => {
            const couleur = RARITY_COLORS[e.rarity?.stars ?? 1];
            const Icone = ICONE_SLOT[e.slot] ?? ChestIcon;
            const estEquipe = !!e.equippedOn;

            const carte = (
              <div
                className={styles.card}
                style={{
                  background: `linear-gradient(160deg, ${couleur}bb, ${couleur}55)`,
                  borderColor: couleur,
                }}
              >
                <span className={styles.cardLabel}>{e.name.toUpperCase()}</span>
                <Icone size={40} />
                <span className={styles.cardBonus}>
                  +{e.bonusValue} {e.bonusStat}
                </span>
                <span className={styles.cardStars}>
                  {"★".repeat(e.rarity?.stars ?? 0)}
                </span>
                {estEquipe && (
                  <span className={styles.equippedBadge}>
                    {e.equippedOn!.personnage.name}
                  </span>
                )}
              </div>
            );

            if (!estEquipe) {
              return (
                <div key={e.id} className={styles.cardWrapper}>
                  {carte}
                </div>
              );
            }

            return (
              <form
                key={e.id}
                action={async () => {
                  "use server";
                  await desequiperObjet(e.id);
                }}
              >
                <button type="submit" className={styles.cardButton}>
                  {carte}
                </button>
              </form>
            );
          })}

          {Array.from({ length: cellulesVides }).map((_, i) => (
            <div key={`vide-${i}`} className={styles.cardEmpty} />
          ))}
        </div>
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        buildHref={(p) => construireLien({ page: p })}
      />
    </main>
  );
}
