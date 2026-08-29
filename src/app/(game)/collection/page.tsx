import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CollectionClient from "./CollectionClient";

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const personnages = await prisma.personnage.findMany({
    where: { ownerId: session.user.id },
    orderBy: { id: "desc" },
    include: { rarity: true, equipment: { include: { equipment: true } } },
  });

  return <CollectionClient personnages={personnages} />;
}
