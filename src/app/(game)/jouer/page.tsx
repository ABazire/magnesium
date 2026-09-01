import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import JouerClient from "./JouerClient";

export default async function JouerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [equipes, tousLesPersonnages] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: session.user.id },
      orderBy: { id: "asc" },
      include: {
        membres: {
          orderBy: { position: "asc" },
          include: {
            personnage: {
              select: {
                id: true,
                name: true,
                color: true,
                spriteId: true,
                level: true,
                xp: true,
                rarity: { select: { stars: true } },
              },
            },
          },
        },
      },
    }),
    prisma.personnage.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, color: true, spriteId: true, level: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <JouerClient equipes={equipes} tousLesPersonnages={tousLesPersonnages} />
  );
}
