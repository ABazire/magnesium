import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ouvrirCoffre } from "../../actions/coffre";
import styles from "./page.module.css";
import { CoinIcon, ChestIcon } from "@/components/pixel";

export default async function CoffrePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Coffres</h1>

      <p className={styles.currency}>
        <CoinIcon size={18} /> Monnaie :{" "}
        <span className={styles.currencyValue}>{user.currency}</span>
      </p>

      <form action={ouvrirCoffre}>
        <button
          type="submit"
          className={styles.openButton}
          disabled={user.currency < 80}
        >
          Ouvrir un coffre (80 monnaie)
        </button>
      </form>
    </main>
  );
}
