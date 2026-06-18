"use client";

import { TopBar } from "@/components/layout/TopBar";
import { SectionCard } from "@/components/shared/SectionCard";
import { AnalogueOutcomes } from "@/components/research/AnalogueOutcomes";
import { StressTester } from "@/components/research/StressTester";
import { AlertSubscribe } from "@/components/research/AlertSubscribe";
import { useWindow } from "@/providers/WindowProvider";

export default function ResearchPage() {
  const { window } = useWindow();

  return (
    <>
      <TopBar title="Research" subtitle="Analogues · Stress Test · Alerts" />
      <main className="p-6 space-y-5 max-w-7xl">
        <SectionCard
          title="What Happens Next"
          subtitle="Historical outcomes after similar conditions or regime transitions"
        >
          <AnalogueOutcomes window={window} />
        </SectionCard>

        <SectionCard
          title="Portfolio Stress Tester"
          subtitle="Correlation-adjusted volatility across historical regimes"
        >
          <StressTester window={window} />
        </SectionCard>

        <SectionCard
          title="Alerts"
          subtitle="Email + Discord · fires when |z| > 2σ"
        >
          <AlertSubscribe />
        </SectionCard>
      </main>
    </>
  );
}
