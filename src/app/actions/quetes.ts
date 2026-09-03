"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  getQuetesDuJour,
  reclamerRecompenseQuete,
} from "@/lib/quetes";

export async function getMesQuetes() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  return getQuetesDuJour(session.user.id);
}

export async function reclamerMaQuete(cle: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const recompense = await reclamerRecompenseQuete(session.user.id, cle);
  revalidatePath("/jouer");
  return recompense;
}
