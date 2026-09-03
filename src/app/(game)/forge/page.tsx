import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ForgeClient from "./ForgeClient";

export default async function ForgePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [user, stocks, equipements] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.materialStack.findMany({ where: { ownerId: session.user.id } }),
    prisma.equipment.findMany({
      where: { ownerId: session.user.id },
      include: { rarity: true },
      orderBy: [{ slot: "asc" }, { niveau: "desc" }],
    }),
  ]);

  const materiaux: Record<string, number> = {};
  for (const s of stocks) materiaux[s.type] = s.quantity;

  return (
    <ForgeClient
      currency={user.currency}
      materiaux={materiaux}
      equipements={equipements.map((e) => ({
        id: e.id,
        name: e.name,
        slot: e.slot,
        bonusStat: e.bonusStat,
        bonusValue: e.bonusValue,
        niveau: e.niveau,
        ensemble: e.ensemble,
        stars: e.rarity.stars,
      }))}
    />
  );
}
