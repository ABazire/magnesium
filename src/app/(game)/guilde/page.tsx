import { auth } from "@/auth";
import { redirect } from "next/navigation";
import GuildeClient from "./GuildeClient";

export default async function GuildePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  return <GuildeClient />;
}
