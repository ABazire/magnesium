import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import VersionTag from "@/components/VersionTag";
import { getEnergieEtCoupons } from "@/lib/energy";
import { enregistrerConnexionQuotidienne } from "@/lib/quetes";
import QuetesPanel from "@/components/QuetesPanel";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true, diamonds: true, hasCompletedTutorial: true },
      })
    : null;

  if (user && !user.hasCompletedTutorial) {
    redirect("/tutoriel");
  }

  // Une fois par jour, en dehors du chemin critique de rendu : la mise à
  // jour du streak ne doit jamais faire échouer l'affichage de la page.
  if (session?.user?.id && user) {
    enregistrerConnexionQuotidienne(session.user.id).catch(() => {});
  }

  const ressources = session?.user?.id
    ? await getEnergieEtCoupons(session.user.id)
    : { energy: 0, coupons: 0 };

  return (
    <div>
      <VersionTag />
      <NavBar
        currency={user?.currency ?? 0}
        diamonds={user?.diamonds ?? 0}
        energy={ressources.energy}
        coupons={ressources.coupons}
      />
      <div>{children}</div>
      {user && <QuetesPanel />}
    </div>
  );
}
