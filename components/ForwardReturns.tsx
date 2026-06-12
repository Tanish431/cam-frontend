"use client";

import { useEffect, useState } from "react";

interface FwdReturn {
    symbol: string;
    horizon_days: number;
    avg_return: number;
    median_return: number;
    win_rate: number;
    sample_count: number;
}

function ReturnCell({ value }: { value: number }) {
    const pct = (value * 100).toFixed(2);
    const color =
        value > 0
            ? "text-green-600"
            : value < 0
              ? "text-red-500"
              : "text-gray-400";
    return (
        <span className={`font-mono font-semibold ${color}`}>
            {value > 0 ? "+" : ""}
            {pct}%
        </span>
    );
}

function WinRateCell({ value }: { value: number }) {
    const pct = (value * 100).toFixed(0);
    const color =
        value > 0.55
            ? "text-green-600"
            : value < 0.45
              ? "text-red-500"
              : "text-gray-500";
    return <span className={`font-mono ${color}`}>{pct}%</span>;
}

export default function ForwardReturns({
    symbolA,
    symbolB,
    window,
}: {
    symbolA: string;
    symbolB: string;
    window: number;
}) {
    const [data, setData] = useState<FwdReturn[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const a = encodeURIComponent(symbolA);
        const b = encodeURIComponent(symbolB);
        fetch(
            `http://localhost:8080/api/forward-returns/${a}/${b}?window=${window}`,
        )
            .then((r) => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [symbolA, symbolB, window]);

    if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;
    if (!data.length)
        return (
            <div className="text-gray-400 text-sm">
                No forward return data for this pair yet.
            </div>
        );

    // group by symbol
    const symbols = [...new Set(data.map((d) => d.symbol))];

    return (
        <div>
            <p className="text-xs text-gray-400 mb-3">
                Historical forward returns following a {window}d correlation
                anomaly (|z| &gt; 2σ)
            </p>
            {symbols.map((sym) => {
                const rows = data
                    .filter((d) => d.symbol === sym)
                    .sort((a, b) => a.horizon_days - b.horizon_days);
                const sample = rows[0]?.sample_count ?? 0;
                return (
                    <div key={sym} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono font-bold text-gray-800">
                                {sym}
                            </span>
                            <span className="text-xs text-gray-400">
                                {sample} historical instances
                            </span>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-1.5 text-xs text-gray-400 font-medium">
                                        Horizon
                                    </th>
                                    <th className="text-right py-1.5 text-xs text-gray-400 font-medium">
                                        Avg return
                                    </th>
                                    <th className="text-right py-1.5 text-xs text-gray-400 font-medium">
                                        Median
                                    </th>
                                    <th className="text-right py-1.5 text-xs text-gray-400 font-medium">
                                        Win rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rows.map((r, idx) => (
                                    <tr
                                        key={`${sym}-${r.horizon_days}-${idx}`}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="py-2 text-gray-600">
                                            {r.horizon_days}d
                                        </td>
                                        <td className="py-2 text-right">
                                            <ReturnCell value={r.avg_return} />
                                        </td>
                                        <td className="py-2 text-right">
                                            <ReturnCell
                                                value={r.median_return}
                                            />
                                        </td>
                                        <td className="py-2 text-right">
                                            <WinRateCell value={r.win_rate} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}
            <p className="text-xs text-gray-400 mt-2">
                Win rate &gt;55% = historically bullish signal. &lt;45% =
                bearish.
            </p>
        </div>
    );
}
