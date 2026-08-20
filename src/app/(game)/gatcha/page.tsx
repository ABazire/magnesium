import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { tirerGatcha } from "../../actions/gatcha";
import { ajouterMonnaieDev } from "../../actions/dev";
import styles from "./page.module.css";

export default async function GatchaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Tirage</h1>

      <p className={styles.currency}>
        Monnaie : <span className={styles.currencyValue}>{user.currency}</span>
      </p>

      <form action={ajouterMonnaieDev}>
        <button type="submit" className={styles.devButton}>
          [DEV] +100 monnaie
        </button>
      </form>

      <form action={tirerGatcha}>
        <button
          type="submit"
          className={styles.pullButton}
          disabled={user.currency < 100}
        >
          Tirer (100 monnaie)
        </button>
      </form>
    </main>
  );
}
