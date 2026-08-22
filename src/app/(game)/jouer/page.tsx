import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import JouerClient from "./JouerClient";

export default async function JouerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const equipe = await prisma.personnage.findMany({
    where: { ownerId: session.user.id, inTeam: true },
    include: { rarity: true, equipment: { include: { equipment: true } } },
  });

  return <JouerClient equipe={equipe} />;
}
