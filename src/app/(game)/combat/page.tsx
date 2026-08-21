import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { lancerCombat } from "../../actions/combat";
import styles from "./page.module.css";

export default async function CombatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const mesPersonnages = await prisma.personnage.findMany({
    where: { ownerId: session.user.id },
  });

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Combat</h1>

      <form action={lancerCombat} className={styles.form}>
        <select name="a" className={styles.select} required>
          <option value="">Choisir le personnage 1</option>
          {mesPersonnages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="b"
          placeholder="Id de l'adversaire"
          className={styles.textInput}
          required
        />

        <button type="submit" className={styles.button}>
          Lancer le combat
        </button>
      </form>
    </main>
  );
}
