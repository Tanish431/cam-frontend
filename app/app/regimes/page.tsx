"use client";

import { TopBar } from "@/components/layout/TopBar";
import { SectionCard } from "@/components/shared/SectionCard";
import { CurrentRegimeCard } from "@/components/regimes/CurrentRegimeCard";
import { ClusterProfiles } from "@/components/regimes/ClusterProfiles";
import { RegimeTimeline } from "@/components/regimes/RegimeTimeline";
import { TransitionMatrix } from "@/components/regimes/TransitionMatrix";
import { StructuralBreaks } from "@/components/regimes/StructuralBreaks";
import { useWindow } from "@/providers/WindowProvider";

export default function RegimesPage() {
  const { window } = useWindow();

  return (
    <>
      <TopBar
        title="Regime Analysis"
        subtitle="Classification · Transitions · Change Points"
      />

      <main className="p-6 space-y-5 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <CurrentRegimeCard window={window} />
          <SectionCard
            title="All Regimes"
            subtitle="K-Means cluster profiles"
            className="h-full"
          >
            <ClusterProfiles window={window} />
          </SectionCard>
        </div>

        <SectionCard
          title="Regime Timeline"
          subtitle="Full 2-year history · hover to inspect any day"
        >
          <RegimeTimeline window={window} />
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard
            title="Transition Matrix"
            subtitle="Probability of moving between regimes"
          >
            <TransitionMatrix window={window} />
          </SectionCard>

          <SectionCard
            title="Structural Breaks"
            subtitle="PELT change-point detection"
          >
            <StructuralBreaks window={window} />
          </SectionCard>
        </div>
      </main>
    </>
  );
}
