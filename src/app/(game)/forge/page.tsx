import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ForgeClient from "./ForgeClient";

export default async function ForgePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [user, stocks] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.materialStack.findMany({ where: { ownerId: session.user.id } }),
  ]);

  const materiaux: Record<string, number> = {};
  for (const s of stocks) materiaux[s.type] = s.quantity;

  return <ForgeClient currency={user.currency} materiaux={materiaux} />;
}
