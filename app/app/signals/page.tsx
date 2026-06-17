"use client";

import { TopBar } from "@/components/layout/TopBar";
import { SectionCard } from "@/components/shared/SectionCard";
import { CTASignals } from "@/components/signals/CTASignals";
import { RiskPremia } from "@/components/signals/RiskPremia";
import { FactorExposure } from "@/components/signals/FactorExposure";
import { ForwardReturnsSummary } from "@/components/signals/ForwardReturnsSummary";
import { useWindow } from "@/providers/WindowProvider";

export default function SignalsPage() {
  const { window } = useWindow();

  return (
    <>
      <TopBar
        title="Signals & Factors"
        subtitle="CTA · Risk Premia · Factor Exposure"
      />
      <main className="p-6 space-y-5 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard
            title="CTA Signals"
            subtitle="Trend · momentum · volatility regime"
          >
            <CTASignals />
          </SectionCard>
          <SectionCard
            title="Risk Premia Rankings"
            subtitle="Carry · defensive · low vol"
          >
            <RiskPremia />
          </SectionCard>
        </div>
        <SectionCard
          title="Factor Exposure Decomposition"
          subtitle="Market beta, VIX correlation, vol ratio, drawdown"
        >
          <FactorExposure />
        </SectionCard>
        <SectionCard
          title="Forward Returns Summary"
          subtitle={`All assets · ${window}d window`}
        >
          <ForwardReturnsSummary window={window} />
        </SectionCard>
      </main>
    </>
  );
}
