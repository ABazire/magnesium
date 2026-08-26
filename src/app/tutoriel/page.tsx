import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TutorielClient from "./TutorielClient";

export default async function TutorielPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return <TutorielClient />;
}
