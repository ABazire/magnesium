import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import VersionTag from "@/components/VersionTag";

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

  return (
    <div>
      <VersionTag />
      <NavBar currency={user?.currency ?? 0} diamonds={user?.diamonds ?? 0} />
      <div style={{ paddingBottom: "70px" }}>{children}</div>
    </div>
  );
}
