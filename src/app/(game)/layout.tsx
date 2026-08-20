import NavBar from "@/components/NavBar";
import VersionTag from "@/components/VersionTag";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <VersionTag />
      <NavBar />
      <div style={{ paddingBottom: "70px" }}>{children}</div>
    </div>
  );
}
