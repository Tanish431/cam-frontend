import { TopBar } from "@/components/layout/TopBar";
export default function SignalsPage() {
  return (
    <>
      <TopBar
        title="Signals & Factors"
        subtitle="CTA · Risk Premia · Factor Exposure"
      />
      <main className="p-6">
        <p className="text-muted-foreground text-sm">Signals coming next...</p>
      </main>
    </>
  );
}
