import NavBar from "@/components/NavBar";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <NavBar />
      <div style={{ paddingBottom: "70px" }}>{children}</div>
    </div>
  );
}
