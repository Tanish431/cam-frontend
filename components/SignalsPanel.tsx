"use client";

import { useEffect, useState } from "react";

interface Signal {
    symbol: string;
    signal_type: string;
    value: number;
    normalized: number;
}

interface AssetSignals {
    symbol: string;
    trend: Signal | null;
    momentum: Signal | null;
    vol_regime: Signal | null;
}

function TrendArrow({ value }: { value: number }) {
    if (value > 0)
        return <span className="text-green-600 font-bold">↑ Above MA200</span>;
    if (value < 0)
        return <span className="text-red-500 font-bold">↓ Below MA200</span>;
    return <span className="text-gray-400">—</span>;
}

function MomentumBar({ normalized }: { normalized: number }) {
    const clamped = Math.max(-2, Math.min(2, normalized));
    const pct = ((clamped + 2) / 4) * 100;
    const color =
        normalized > 0.5
            ? "bg-green-500"
            : normalized < -0.5
              ? "bg-red-400"
              : "bg-gray-300";
    return (
        <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-mono text-gray-500">
                {normalized.toFixed(2)}σ
            </span>
        </div>
    );
}

function VolBadge({ value }: { value: number }) {
    if (value > 1.5)
        return (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                High Vol {value.toFixed(2)}x
            </span>
        );
    if (value > 1.0)
        return (
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                Elevated {value.toFixed(2)}x
            </span>
        );
    return (
        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
            Low Vol {value.toFixed(2)}x
        </span>
    );
}

export default function SignalsPanel() {
    const [assetSignals, setAssetSignals] = useState<AssetSignals[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:8080/api/signals")
            .then((r) => r.json())
            .then((data: Signal[]) => {
                // group by symbol
                const map = new Map<string, AssetSignals>();
                for (const s of data) {
                    if (!map.has(s.symbol)) {
                        map.set(s.symbol, {
                            symbol: s.symbol,
                            trend: null,
                            momentum: null,
                            vol_regime: null,
                        });
                    }
                    const entry = map.get(s.symbol)!;
                    if (s.signal_type === "trend") entry.trend = s;
                    if (s.signal_type === "momentum") entry.momentum = s;
                    if (s.signal_type === "vol_regime") entry.vol_regime = s;
                }
                setAssetSignals(Array.from(map.values()));
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading)
        return <div className="text-gray-400 text-sm">Loading signals...</div>;

    return (
        <div className="overflow-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                            Asset
                        </th>
                        <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                            Trend
                        </th>
                        <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                            Momentum
                        </th>
                        <th className="text-left py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                            Volatility
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {assetSignals.map((a) => (
                        <tr key={a.symbol} className="hover:bg-gray-50">
                            <td className="py-3 pr-4 font-mono font-bold text-gray-800">
                                {a.symbol}
                            </td>
                            <td className="py-3 pr-4">
                                {a.trend ? (
                                    <TrendArrow value={a.trend.value} />
                                ) : (
                                    "—"
                                )}
                            </td>
                            <td className="py-3 pr-4">
                                {a.momentum ? (
                                    <MomentumBar
                                        normalized={a.momentum.normalized}
                                    />
                                ) : (
                                    "—"
                                )}
                            </td>
                            <td className="py-3">
                                {a.vol_regime ? (
                                    <VolBadge value={a.vol_regime.value} />
                                ) : (
                                    "—"
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
