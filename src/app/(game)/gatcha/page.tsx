import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import GatchaClient from "./GatchaClient";

export default async function GatchaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  return <GatchaClient currencyInitiale={user.currency} />;
}
