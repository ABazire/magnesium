import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AventureClient from "./AventureClient";

export default async function AventurePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const equipes = await prisma.team.findMany({
    where: { ownerId: session.user.id },
    orderBy: { id: "asc" },
    include: {
      membres: {
        orderBy: { position: "asc" },
        include: {
          personnage: {
            select: { id: true, name: true, color: true, spriteId: true },
          },
        },
      },
    },
  });

  return <AventureClient equipes={equipes} />;
}
