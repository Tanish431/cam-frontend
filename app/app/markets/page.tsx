"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { SectionCard } from "@/components/shared/SectionCard";
import { CorrelationHeatmap } from "@/components/markets/CorrelationHeatmap";
import { QuickStats } from "@/components/markets/QuickStats";
import { PairDrawer } from "@/components/markets/PairDrawer";
import { useWindow } from "@/providers/WindowProvider";
import NetworkGraph from "@/components/NetworkGraph";
import PCAScatter from "@/components/PCAScatter";

export default function MarketsPage() {
  const { window } = useWindow();
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(
    null,
  );

  return (
    <>
      <TopBar title="Market Structure" subtitle="Correlation · Network · PCA" />

      <main className="p-6 space-y-5 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <SectionCard
            title="Correlation Matrix"
            subtitle={`${window}d rolling window across all asset pairs`}
          >
            <CorrelationHeatmap
              window={window}
              onSelectPair={(a, b) => setSelectedPair([a, b])}
              selectedPair={selectedPair}
            />
          </SectionCard>

          <SectionCard title="Quick Stats" subtitle="At a glance">
            <QuickStats window={window} />
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard
            title="Correlation Network"
            subtitle="Force-directed graph · drag nodes to explore"
            contentClassName="pt-2"
          >
            <NetworkGraph window={window} />
          </SectionCard>

          <SectionCard
            title="Regime Space (PCA)"
            subtitle="2D projection of the correlation Z-score matrix"
            contentClassName="pt-2"
          >
            <PCAScatter window={window} />
          </SectionCard>
        </div>
      </main>

      <PairDrawer
        pair={selectedPair}
        window={window}
        onClose={() => setSelectedPair(null)}
      />
    </>
  );
}
