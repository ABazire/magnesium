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
import { Flame, HeartPulse, Snowflake, Shield, Sparkles } from "lucide-react";
import { desequiperObjet } from "../../actions/equiper";
import { desequiperSort } from "../../actions/sorts";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import FusionEquipement from "@/components/FusionEquipement";
import { NOMS_MATERIAU } from "@/lib/monsterDrops";
import { SEUILS_FUSION } from "@/lib/fusion";
import { descriptionSort } from "@/lib/spell";
import styles from "./page.module.css";
import type { Prisma, EquipmentSlot, MaterialType } from "@prisma/client";
import Link from "next/link";

const PAR_PAGE = 24;
const COLONNES = 8;

const ICONE_SLOT: Record<string, ComponentType<{ size?: number }>> = {
  ARME: SwordIcon,
  ARMURE: ArmorIcon,
  BOTTES: BootsIcon,
  AMULETTE: AmuletIcon,
};

const ICONE_EFFET: Record<string, ComponentType<{ size?: number }>> = {
  DEGATS: Flame,
  SOIN: HeartPulse,
  ETOURDISSEMENT: Snowflake,
  BONUS_STAT: Sparkles,
  REDUCTION_DEGATS: Shield,
};

const RARITY_COLORS: Record<number, string> = {
  1: "#9db3aa",
  2: "#7fd9c4",
  3: "#5cc8ff",
  4: "#c792ea",
  5: "#ff9d81",
  6: "#f2c94c",
};

const TOUS_LES_MATERIAUX: MaterialType[] = [
  "GRIFFE",
  "CROC",
  "OS",
  "CUIR",
  "ESSENCE_ELEMENTAIRE",
  "PLUME",
  "ECAILLE_CRISTAL",
];

const TABS: { value: string; label: string }[] = [
  { value: "objets", label: "Objets" },
  { value: "equipement", label: "Équipement" },
  { value: "sorts", label: "Sorts" },
];

type SearchParams = {
  tab?: string;
  minStars?: string;
  slot?: string;
  statut?: string;
  bonusStat?: string;
  type?: string;
  effect?: string;
  tri?: string;
  q?: string;
  page?: string;
};

export default async function InventairePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const sp = await searchParams;
  const tab = TABS.some((t) => t.value === sp.tab) ? sp.tab! : "objets";

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Inventaire</h1>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/inventaire?tab=${t.value}`}
            className={tab === t.value ? styles.tabActive : styles.tab}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "objets" && <InventaireObjets userId={session.user.id} />}
      {tab === "equipement" && (
        <InventaireEquipement userId={session.user.id} sp={sp} />
      )}
      {tab === "sorts" && <InventaireSorts userId={session.user.id} sp={sp} />}
    </main>
  );
}

async function InventaireObjets({ userId }: { userId: string }) {
  const stocks = await prisma.materialStack.findMany({
    where: { ownerId: userId },
  });
  const quantiteParType = new Map(stocks.map((s) => [s.type, s.quantity]));

  return (
    <div className={styles.materiauxGrid}>
      {TOUS_LES_MATERIAUX.map((type) => {
        const quantite = quantiteParType.get(type) ?? 0;
        return (
          <div
            key={type}
            className={
              quantite > 0 ? styles.materiauCard : styles.materiauCardVide
            }
          >
            <span className={styles.materiauNom}>{NOMS_MATERIAU[type]}</span>
            <span className={styles.materiauQuantite}>{quantite}</span>
          </div>
        );
      })}
    </div>
  );
}

type EquipementAvecRelations = Prisma.EquipmentGetPayload<{
  include: { rarity: true; equippedOn: { include: { personnage: true } } };
}>;

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

const CHAMPS_TRI_EQUIPEMENT = [
  { value: "stars", label: "Étoiles" },
  { value: "bonus", label: "Bonus" },
] as const;

type ChampTriEquipement = (typeof CHAMPS_TRI_EQUIPEMENT)[number]["value"];

const TRI_OPTIONS_EQUIPEMENT = [
  { value: "", label: "Tri : aucun" },
  ...CHAMPS_TRI_EQUIPEMENT.flatMap((c) => [
    { value: `${c.value}-desc`, label: `${c.label} ↓` },
    { value: `${c.value}-asc`, label: `${c.label} ↑` },
  ]),
];

function valeurTriEquipement(
  e: EquipementAvecRelations,
  champ: ChampTriEquipement,
): number {
  if (champ === "stars") return e.rarity?.stars ?? 0;
  return e.bonusValue;
}

async function InventaireEquipement({
  userId,
  sp,
}: {
  userId: string;
  sp: SearchParams;
}) {
  const { minStars, slot, statut, bonusStat, tri, q, page } = sp;
  const minStarsNum = minStars ? Number(minStars) : 0;
  const pageActuelle = page ? Math.max(1, Number(page)) : 1;

  let champTri: ChampTriEquipement | null = null;
  let sensTri: "asc" | "desc" = "desc";
  if (tri) {
    const [champ, sens] = tri.split("-");
    if (CHAMPS_TRI_EQUIPEMENT.some((c) => c.value === champ)) {
      champTri = champ as ChampTriEquipement;
      sensTri = sens === "asc" ? "asc" : "desc";
    }
  }

  const tousLesEquipements = await prisma.equipment.findMany({
    where: { ownerId: userId },
    orderBy: { id: "desc" },
    include: { rarity: true, equippedOn: { include: { personnage: true } } },
  });

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
      (a, b) => (valeurTriEquipement(a, champ) - valeurTriEquipement(b, champ)) * facteur,
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const debut = (pageActuelle - 1) * PAR_PAGE;
  const equipementsPage = filtres.slice(debut, debut + PAR_PAGE);
  const cellulesVides =
    (COLONNES - (equipementsPage.length % COLONNES)) % COLONNES;

  function construireLien(params: Record<string, string | number>) {
    const qs = new URLSearchParams({
      tab: "equipement",
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
    <>
      <FusionEquipement groupes={groupesFusables} />

      <FilterBar
        action="/inventaire"
        hidden={{ tab: "equipement" }}
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
            options: TRI_OPTIONS_EQUIPEMENT,
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
    </>
  );
}

type SortAvecRelations = Prisma.SpellGetPayload<{
  include: { rarity: true; equippedOn: { include: { personnage: true } } };
}>;

const TYPE_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "ACTIF", label: "Actif" },
  { value: "PASSIF", label: "Passif" },
];

const EFFET_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "DEGATS", label: "Dégâts" },
  { value: "SOIN", label: "Soin" },
  { value: "ETOURDISSEMENT", label: "Étourdissement" },
  { value: "BONUS_STAT", label: "Bonus stat" },
  { value: "REDUCTION_DEGATS", label: "Réduction dégâts" },
];

const CHAMPS_TRI_SORT = [
  { value: "stars", label: "Étoiles" },
  { value: "mana", label: "Mana" },
  { value: "cooldown", label: "Cooldown" },
] as const;

type ChampTriSort = (typeof CHAMPS_TRI_SORT)[number]["value"];

const TRI_OPTIONS_SORT = [
  { value: "", label: "Tri : aucun" },
  ...CHAMPS_TRI_SORT.flatMap((c) => [
    { value: `${c.value}-desc`, label: `${c.label} ↓` },
    { value: `${c.value}-asc`, label: `${c.label} ↑` },
  ]),
];

function valeurTriSort(s: SortAvecRelations, champ: ChampTriSort): number {
  if (champ === "stars") return s.rarity?.stars ?? 0;
  if (champ === "mana") return s.manaCost;
  return s.cooldown;
}

async function InventaireSorts({
  userId,
  sp,
}: {
  userId: string;
  sp: SearchParams;
}) {
  const { minStars, statut, type, effect, tri, q, page } = sp;
  const minStarsNum = minStars ? Number(minStars) : 0;
  const pageActuelle = page ? Math.max(1, Number(page)) : 1;

  let champTri: ChampTriSort | null = null;
  let sensTri: "asc" | "desc" = "desc";
  if (tri) {
    const [champ, sens] = tri.split("-");
    if (CHAMPS_TRI_SORT.some((c) => c.value === champ)) {
      champTri = champ as ChampTriSort;
      sensTri = sens === "asc" ? "asc" : "desc";
    }
  }

  const tousLesSorts = await prisma.spell.findMany({
    where: { ownerId: userId },
    orderBy: { id: "desc" },
    include: { rarity: true, equippedOn: { include: { personnage: true } } },
  });

  let filtres = tousLesSorts.filter((s) => (s.rarity?.stars ?? 0) >= minStarsNum);
  if (type) filtres = filtres.filter((s) => s.type === type);
  if (effect) filtres = filtres.filter((s) => s.effect === effect);
  if (statut === "equipe") filtres = filtres.filter((s) => !!s.equippedOn);
  if (statut === "libre") filtres = filtres.filter((s) => !s.equippedOn);

  if (q) {
    const qLower = q.toLowerCase();
    filtres = filtres.filter((s) => s.name.toLowerCase().includes(qLower));
  }

  if (champTri) {
    const facteur = sensTri === "asc" ? 1 : -1;
    const champ = champTri;
    filtres = [...filtres].sort(
      (a, b) => (valeurTriSort(a, champ) - valeurTriSort(b, champ)) * facteur,
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const debut = (pageActuelle - 1) * PAR_PAGE;
  const sortsPage = filtres.slice(debut, debut + PAR_PAGE);
  const cellulesVides =
    (COLONNES - (sortsPage.length % COLONNES)) % COLONNES;

  function construireLien(params: Record<string, string | number>) {
    const qs = new URLSearchParams({
      tab: "sorts",
      minStars: String(minStarsNum),
      ...(type ? { type } : {}),
      ...(effect ? { effect } : {}),
      ...(statut ? { statut } : {}),
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
    <>
      <FilterBar
        action="/inventaire"
        hidden={{ tab: "sorts" }}
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
            name: "type",
            label: "Type",
            value: type ?? "",
            options: TYPE_OPTIONS,
          },
          {
            name: "effect",
            label: "Effet",
            value: effect ?? "",
            options: EFFET_OPTIONS,
          },
          {
            name: "statut",
            label: "Statut",
            value: statut ?? "",
            options: STATUT_OPTIONS,
          },
          {
            name: "tri",
            label: "Trier par",
            value: tri ?? "",
            options: TRI_OPTIONS_SORT,
          },
        ]}
        search={{
          name: "q",
          value: q,
          placeholder: "Nom du sort...",
        }}
      />

      {filtres.length === 0 ? (
        <p className={styles.empty}>Aucun sort ne correspond à ces filtres.</p>
      ) : (
        <div className={styles.grid}>
          {sortsPage.map((s) => {
            const couleur = RARITY_COLORS[s.rarity?.stars ?? 1];
            const Icone = ICONE_EFFET[s.effect] ?? Sparkles;
            const estEquipe = !!s.equippedOn;

            const carte = (
              <div
                className={styles.card}
                style={{
                  background: `linear-gradient(160deg, ${couleur}bb, ${couleur}55)`,
                  borderColor: couleur,
                }}
              >
                <span className={styles.cardLabel}>{s.name.toUpperCase()}</span>
                <Icone size={40} />
                <span className={styles.cardBonus}>{descriptionSort(s)}</span>
                <span className={styles.cardStars}>
                  {"★".repeat(s.rarity?.stars ?? 0)}
                </span>
                {estEquipe && (
                  <span className={styles.equippedBadge}>
                    {s.equippedOn!.personnage.name}
                  </span>
                )}
              </div>
            );

            if (!estEquipe) {
              return (
                <div key={s.id} className={styles.cardWrapper}>
                  {carte}
                </div>
              );
            }

            return (
              <form
                key={s.id}
                action={async () => {
                  "use server";
                  await desequiperSort(s.id);
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
    </>
  );
}
