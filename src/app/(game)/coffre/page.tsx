import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CoffreClient from "./CoffreClient";

export default async function CoffrePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  return <CoffreClient currencyInitiale={user.currency} />;
}
