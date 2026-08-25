import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import CombatViewer from "@/components/CombatViewer";
import type { CombatEvent } from "@/lib/combat";
import styles from "../page.module.css";
import { PersonnageIcon } from "@/components/pixel";

export default async function CombatResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id } = await params;
  const fight = await prisma.fight.findUnique({ where: { id } });
  if (!fight) notFound();

  const [attaquant, defenseur] = await Promise.all([
    prisma.personnage.findUnique({ where: { id: fight.attackerPersonnageId } }),
    prisma.personnage.findUnique({ where: { id: fight.defenderPersonnageId } }),
  ]);

  const events = fight.turns as CombatEvent[];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Combat</h1>
      <CombatViewer
        fighters={[
          {
            id: fight.attackerPersonnageId,
            name: attaquant?.name ?? "?",
            vieMax: fight.attackerVieMax,
            iconKey: "personnage",
            couleur: attaquant?.color,
            spriteVariant: attaquant?.spriteId,
          },
          {
            id: fight.defenderPersonnageId,
            name: defenseur?.name ?? "?",
            vieMax: fight.defenderVieMax,
            iconKey: "personnage",
            couleur: defenseur?.color,
            spriteVariant: defenseur?.spriteId,
          },
        ]}
        events={events}
        winnerId={fight.winnerId}
      />
    </main>
  );
}
