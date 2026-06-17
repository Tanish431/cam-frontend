"use client";

import { TopBar } from "@/components/layout/TopBar";
import AnalogueFinder from "@/components/AnalogueFinder";
import PortfolioStressTester from "@/components/PortfolioStressTester";
import WhatHappensNext from "@/components/WhatHappensNext";
import AlertSubscribe from "@/components/AlertSubscribe";
import LeadLagChart from "@/components/LeadLagChart";
import AssetSelector from "@/components/AssetSelector";
import { useWindow } from "@/providers/WindowProvider";
import { useState } from "react";

export default function ResearchPage() {
  const { window } = useWindow();
  const [symbolA, setSymbolA] = useState("SPY");
  const [symbolB, setSymbolB] = useState("TLT");

  return (
    <>
      <TopBar title="Research" subtitle="Analogues · Stress Test · Alerts" />
      <main className="p-6 space-y-6">
        {/* what happens next */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-1">
            What Happens Next?
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Asset returns following analogue dates and regime transitions
          </p>
          <WhatHappensNext window={window} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* analogue finder */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground mb-1">
              Analogue Finder
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Most structurally similar historical dates by cosine similarity
            </p>
            <AnalogueFinder window={window} />
          </div>

          {/* portfolio stress */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground mb-1">
              Portfolio Stress Test
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Correlation-adjusted volatility across regimes
            </p>
            <PortfolioStressTester window={window} />
          </div>
        </div>

        {/* lead-lag */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-1">
            Lead-Lag Analysis
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Cross-correlation at lags -10 to +10 days — which asset leads?
          </p>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Asset A</p>
                <AssetSelector value={symbolA} onChange={setSymbolA} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Asset B</p>
                <AssetSelector value={symbolB} onChange={setSymbolB} />
              </div>
            </div>
            <LeadLagChart symbolA={symbolA} symbolB={symbolB} />
          </div>
        </div>

        {/* alert subscribe */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-1">
            Regime Alerts
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Get notified by email and Discord when |z| &gt; 2σ fires
          </p>
          <AlertSubscribe />
        </div>
      </main>
    </>
  );
}
