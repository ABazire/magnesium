import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import VersionTag from "@/components/VersionTag";
import { getEnergieEtCoupons } from "@/lib/energy";

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
      <div style={{ paddingBottom: "70px" }}>{children}</div>
    </div>
  );
}
