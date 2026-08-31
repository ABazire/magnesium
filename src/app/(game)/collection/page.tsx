import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { statsEffectives, puissance } from "@/lib/personnage";
import styles from "./page.module.css";
import CollectionClient from "./CollectionClient";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import type { Prisma } from "@prisma/client";

type PersonnageAvecRelations = Prisma.PersonnageGetPayload<{
  include: {
    rarity: true;
    equipment: { include: { equipment: true } };
    spells: { include: { spell: true } };
  };
}>;

const PAR_PAGE = 24;

const CHAMPS_TRI = [
  { value: "force", label: "Force" },
  { value: "vitesse", label: "Vitesse" },
  { value: "resistance", label: "Résistance" },
  { value: "agilite", label: "Agilité" },
  { value: "niveau", label: "Niveau" },
  { value: "puissance", label: "Puissance" },
] as const;

type ChampTri = (typeof CHAMPS_TRI)[number]["value"];

const TRI_OPTIONS = [
  { value: "", label: "Tri : aucun" },
  ...CHAMPS_TRI.flatMap((c) => [
    { value: `${c.value}-desc`, label: `${c.label} ↓` },
    { value: `${c.value}-asc`, label: `${c.label} ↑` },
  ]),
];

const EQUIPE_OPTIONS = [
  { value: "", label: "Toutes" },
  { value: "oui", label: "En équipe" },
  { value: "non", label: "Hors équipe" },
];

function valeurTri(p: PersonnageAvecRelations, champ: ChampTri): number {
  if (champ === "niveau") return p.level;
  const stats = statsEffectives(p);
  if (champ === "puissance") return puissance(stats);
  return stats[champ];
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{
    minStars?: string;
    equipe?: string;
    tri?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { minStars, equipe, tri, q, page } = await searchParams;
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

  const tousLesPersonnages = await prisma.personnage.findMany({
    where: { ownerId: session.user.id },
    include: {
      rarity: true,
      equipment: { include: { equipment: true } },
      spells: { include: { spell: true } },
    },
  });

  let filtres = tousLesPersonnages.filter(
    (p) => (p.rarity?.stars ?? 0) >= minStarsNum,
  );

  if (equipe === "oui") filtres = filtres.filter((p) => p.inTeam);
  if (equipe === "non") filtres = filtres.filter((p) => !p.inTeam);

  if (q) {
    const qLower = q.toLowerCase();
    filtres = filtres.filter((p) => p.name.toLowerCase().includes(qLower));
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
  const personnagesPage = filtres.slice(debut, debut + PAR_PAGE);

  const COLONNES = 8;
  const cellulesVides =
    (COLONNES - (personnagesPage.length % COLONNES)) % COLONNES;

  function construireLien(params: Record<string, string | number>) {
    const qs = new URLSearchParams({
      minStars: String(minStarsNum),
      ...(equipe ? { equipe } : {}),
      ...(tri ? { tri } : {}),
      ...(q ? { q } : {}),
      page: String(pageActuelle),
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    });
    return `/collection?${qs.toString()}`;
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Collection</h1>

      <FilterBar
        action="/collection"
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
            name: "equipe",
            label: "Équipe",
            value: equipe ?? "",
            options: EQUIPE_OPTIONS,
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
          placeholder: "Nom du personnage...",
        }}
      />

      {filtres.length === 0 ? (
        <p className={styles.detailEmpty}>
          Aucun personnage ne correspond à ces filtres.
        </p>
      ) : (
        <CollectionClient
          personnages={personnagesPage}
          cellulesVides={cellulesVides}
        />
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        buildHref={(p) => construireLien({ page: p })}
      />
    </main>
  );
}
