import { TopBar } from "@/components/layout/TopBar";

export default function OverviewPage() {
  return (
    <>
      <TopBar
        title="Overview"
        subtitle="MacroLens — Cross-Asset Regime Monitor"
      />
      <main className="p-6">
        <p className="text-muted-foreground text-sm">Overview coming next...</p>
      </main>
    </>
  );
}
