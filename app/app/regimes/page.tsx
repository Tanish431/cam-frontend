import { TopBar } from "@/components/layout/TopBar";
export default function RegimesPage() {
  return (
    <>
      <TopBar
        title="Regime Analysis"
        subtitle="Classification · Transitions · Change Points"
      />
      <main className="p-6">
        <p className="text-muted-foreground text-sm">Regimes coming next...</p>
      </main>
    </>
  );
}
