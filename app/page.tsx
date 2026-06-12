"use client";

import { useEffect, useState } from "react";
import {
    fetchAssets,
    fetchCorrelationMatrix,
    fetchRegimeEvents,
} from "@/lib/api";
import { Asset, CorrelationEntry, RegimeEvent } from "@/lib/types";
import HeatMap from "@/components/HeatMap";
import PairChart from "@/components/PairChart";
import RegimeEvents from "@/components/RegimeEvents";
import SignalsPanel from "@/components/SignalsPanel";
import RiskPremiaPanel from "@/components/RiskPremiaPanel";
import AnalogueFinder from "@/components/AnalogueFinder";
import AlertSubscribe from "@/components/AlertSubscribe";
import ForwardReturns from "@/components/ForwardReturns";
import LeadLagChart from "@/components/LeadLagChart";
import RegimeCluster from "@/components/RegimeCluster";

const WINDOWS = [20, 60, 252];

export default function Dashboard() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [correlations, setCorrelations] = useState<CorrelationEntry[]>([]);
    const [regimeEvents, setRegimeEvents] = useState<RegimeEvent[]>([]);
    const [window_, setWindow] = useState(60);
    const [selectedPair, setSelectedPair] = useState<[string, string] | null>(
        null,
    );
    const [liveEvents, setLiveEvents] = useState<RegimeEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            fetchAssets(),
            fetchCorrelationMatrix(window_),
            fetchRegimeEvents(),
        ]).then(([a, c, r]) => {
            if (cancelled) return;
            setAssets(a);
            setCorrelations(c);
            setRegimeEvents(r);
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [window_]);

    // WebSocket for live regime events
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080/ws");
        ws.onmessage = (e) => {
            const event: RegimeEvent = JSON.parse(e.data);
            setLiveEvents((prev) => [event, ...prev].slice(0, 10));
        };
        ws.onerror = () => console.warn("ws not connected");
        return () => ws.close();
    }, []);

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-400">
                Loading...
            </div>
        );

    return (
        <main className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Cross-Asset Correlation Monitor
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Detect regime changes when historically stable
                            relationships break down
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {WINDOWS.map((w) => (
                            <button
                                key={w}
                                onClick={() => setWindow(w)}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                    window_ === w
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                                }`}
                            >
                                {w}d
                            </button>
                        ))}
                    </div>
                </div>

                {/* Heatmap */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4">
                        Correlation Matrix
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            {window_}-day rolling window · red border = Z &gt;
                            2σ
                        </span>
                    </h2>
                    <HeatMap
                        assets={assets}
                        correlations={correlations}
                        onSelectPair={(a, b) => setSelectedPair([a, b])}
                        selectedPair={selectedPair}
                    />
                </div>

                {/* Regime clustering */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4">
                        Regime Classification
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            K-Means · {window_}d window · k=4 clusters
                        </span>
                    </h2>
                    <RegimeCluster window={window_} />
                </div>

                {/* Pair drilldown + regime events side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-800 mb-4">
                            Regime Anomalies
                            {liveEvents.length > 0 && (
                                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                    {liveEvents.length} live
                                </span>
                            )}
                        </h2>
                        <RegimeEvents
                            events={[...liveEvents, ...regimeEvents]}
                            onSelectPair={(a, b) => setSelectedPair([a, b])}
                        />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4">
                        Pair Analysis
                    </h2>
                    {selectedPair ? (
                        <div className="space-y-6">
                            <PairChart
                                symbolA={selectedPair[0]}
                                symbolB={selectedPair[1]}
                                window={window_}
                            />
                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    Forward Returns After Anomaly
                                </h3>
                                <ForwardReturns
                                    symbolA={selectedPair[0]}
                                    symbolB={selectedPair[1]}
                                    window={window_}
                                />
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    Lead-Lag Relationships
                                </h3>
                                <LeadLagChart
                                    symbolA={selectedPair[0]}
                                    symbolB={selectedPair[1]}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">
                            Click any cell in the matrix to see pair analysis.
                        </p>
                    )}
                </div>
                {/* Signals + Risk Premia side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-800 mb-4">
                            CTA Signals
                            <span className="ml-2 text-xs font-normal text-gray-400">
                                trend · momentum · volatility regime
                            </span>
                        </h2>
                        <SignalsPanel />
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-800 mb-4">
                            Risk Premia Rankings
                            <span className="ml-2 text-xs font-normal text-gray-400">
                                carry · defensive · low vol
                            </span>
                        </h2>
                        <RiskPremiaPanel />
                    </div>
                </div>
                {/* Historical analogue finder */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-800 mb-1">
                        Historical Analogues
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            {window_}d window · cosine similarity of full
                            correlation matrix
                        </span>
                    </h2>
                    <AnalogueFinder window={window_} />
                </div>
                {/* Alert subscriptions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4">
                        Alerts
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            email + discord · fires when |z| &gt; 2σ
                        </span>
                    </h2>
                    <AlertSubscribe />
                </div>
            </div>
        </main>
    );
}
