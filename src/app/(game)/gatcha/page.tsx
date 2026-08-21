import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { tirerGatcha } from "../../actions/gatcha";
import styles from "./page.module.css";
import { CoinIcon, ChestIcon } from "@/components/pixel";

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
        <CoinIcon size={18} /> Monnaie :{" "}
        <span className={styles.currencyValue}>{user.currency}</span>
      </p>

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
