import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AventureClient from "./AventureClient";

export default async function AventurePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [personnages, monstres] = await Promise.all([
    prisma.personnage.findMany({ where: { ownerId: session.user.id } }),
    prisma.monster.findMany(),
  ]);

  return <AventureClient personnages={personnages} monstres={monstres} />;
}
