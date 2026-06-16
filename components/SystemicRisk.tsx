"use client";

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ReferenceLine,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface RiskHistory {
    time: string;
    score: number;
}

interface SystemicRiskData {
    current: number;
    zscore: number;
    mean: number;
    history: RiskHistory[];
}

function RiskGauge({ score, zscore }: { score: number; zscore: number }) {
    const safeScore = Number.isFinite(score) ? score : 0
    const safeZscore = Number.isFinite(zscore) ? zscore : 0
    const pct = Math.min(100, safeScore * 200); // 0.5 avg corr = 100%
    const color =
        safeZscore > 2
            ? "bg-red-500"
            : safeZscore > 1
              ? "bg-orange-400"
              : safeZscore < -1
                ? "bg-green-400"
                : "bg-blue-400";
    const label =
        safeZscore > 2
            ? "Elevated systemic risk"
            : safeZscore > 1
              ? "Above average correlation"
              : safeZscore < -1
                ? "Low systemic risk"
                : "Normal";

    return (
        <div className="flex items-center gap-4">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span
                        className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                            safeZscore > 2
                                ? "bg-red-100 text-red-700"
                                : safeZscore > 1
                                  ? "bg-orange-100 text-orange-700"
                                  : safeZscore < -1
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        z={safeZscore.toFixed(2)}σ
                    </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${color}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">
                        avg corr: {score.toFixed(3)}
                    </span>
                    <span className="text-xs text-gray-400">
                        100% = 0.5 avg
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function SystemicRisk({ window }: { window: number }) {
    const [data, setData] = useState<SystemicRiskData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8080/api/systemic-risk?window=${window}`)
            .then((r) => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [window]);

    if (loading)
        return (
            <div className="text-gray-400 text-sm">
                Computing systemic risk...
            </div>
        );
    if (!data) return <div className="text-gray-400 text-sm">No data.</div>;

    // show last 252 days of history
    const history = data.history?.slice(-252) ?? [];

    return (
        <div className="space-y-4">
            <RiskGauge score={data.current} zscore={data.zscore} />

            <ResponsiveContainer width="100%" height={160}>
                <LineChart
                    data={history}
                    margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 9 }}
                        tickFormatter={(v) => v.slice(5)}
                        interval={Math.floor(history.length / 6)}
                    />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9 }} />
                    <ReferenceLine
                        y={data.mean}
                        stroke="#94a3b8"
                        strokeDasharray="3 3"
                        label={{ value: "avg", fontSize: 9, fill: "#94a3b8" }}
                    />
                    <Tooltip
                        formatter={(value: any) =>
                            typeof value === "number" ? value.toFixed(3) : ""
                        }
                        labelStyle={{ fontSize: 11 }}
                        contentStyle={{ fontSize: 11 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        dot={false}
                        strokeWidth={1.5}
                    />
                </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400">
                Average absolute pairwise correlation across all {window}d
                pairs. Spikes = systemic stress — everything moving together.
            </p>
        </div>
    );
}
