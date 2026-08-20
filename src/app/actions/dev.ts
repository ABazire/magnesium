"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// ⚠️ TEMPORAIRE — à retirer une fois le gain de monnaie via combat implémenté
export async function ajouterMonnaieDev() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { currency: { increment: 100 } },
  });

  revalidatePath("/gatcha");
}
