"use client";

import { useEffect, useState } from "react";

interface Profile {
    cluster_id: number;
    label: string;
}

interface TransitionData {
    probabilities: number[][];
    counts: number[][];
    profiles: Profile[];
    current_cluster: number;
    most_likely_next: number;
    transition_count: number;
}

function probColor(p: number): string {
    if (p > 0.5) return "bg-blue-600 text-white";
    if (p > 0.3) return "bg-blue-400 text-white";
    if (p > 0.1) return "bg-blue-200 text-blue-900";
    if (p > 0.0) return "bg-gray-100 text-gray-500";
    return "bg-white text-gray-200";
}

const CLUSTER_COLORS = [
    "bg-green-100 text-green-700",
    "bg-blue-100 text-blue-700",
    "bg-orange-100 text-orange-700",
    "bg-red-100 text-red-700",
];

export default function TransitionMatrix({ window }: { window: number }) {
    const [data, setData] = useState<TransitionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCounts, setShowCounts] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8080/api/transition-matrix?window=${window}`)
            .then((r) => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [window]);

    if (loading)
        return (
            <div className="text-gray-400 text-sm">
                Computing transitions...
            </div>
        );
    if (!data?.probabilities?.length)
        return (
            <div className="text-gray-400 text-sm">
                Not enough regime transitions yet.
            </div>
        );

    const {
        probabilities,
        counts,
        profiles,
        current_cluster,
        most_likely_next,
        transition_count,
    } = data;
    const k = probabilities.length;

    const currentLabel =
        profiles.find((p) => p.cluster_id === current_cluster)?.label ?? "—";
    const nextLabel =
        profiles.find((p) => p.cluster_id === most_likely_next)?.label ?? "—";
    const nextProb =
        most_likely_next >= 0
            ? (probabilities[current_cluster]?.[most_likely_next] ?? 0)
            : 0;

    return (
        <div className="space-y-4">
            {/* current + likely next */}
            <div className="grid grid-cols-2 gap-3">
                <div
                    className={`rounded-lg px-4 py-3 ${CLUSTER_COLORS[current_cluster % 4]}`}
                >
                    <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-0.5">
                        Current Regime
                    </p>
                    <p className="font-bold text-lg">{currentLabel}</p>
                </div>
                {most_likely_next >= 0 && nextProb > 0 && (
                    <div
                        className={`rounded-lg px-4 py-3 ${CLUSTER_COLORS[most_likely_next % 4]}`}
                    >
                        <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-0.5">
                            Most Likely Next
                        </p>
                        <p className="font-bold text-lg">{nextLabel}</p>
                        <p className="text-xs opacity-70">
                            {(nextProb * 100).toFixed(0)}% probability
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                    Based on {transition_count} actual regime transitions
                    (weekly sampling, consecutive duplicates removed)
                </p>
                <button
                    onClick={() => setShowCounts(!showCounts)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200
            text-gray-600 rounded transition-colors"
                >
                    {showCounts ? "Show %" : "Show counts"}
                </button>
            </div>

            {transition_count < 5 && (
                <div className="text-xs text-orange-500 bg-orange-50 px-3 py-2 rounded">
                    ⚠ Only {transition_count} transitions observed —
                    probabilities have high uncertainty. More data will improve
                    this.
                </div>
            )}

            {/* matrix */}
            <div className="overflow-auto">
                <table className="border-collapse text-sm">
                    <thead>
                        <tr>
                            <th className="w-28 text-left py-2 pr-3 text-xs text-gray-400 font-medium">
                                From → To
                            </th>
                            {profiles.map((p) => (
                                <th
                                    key={p.cluster_id}
                                    className="w-28 text-center py-2 px-2 text-xs font-medium"
                                >
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-gray-400">
                                            C{p.cluster_id}
                                        </span>
                                        <span
                                            className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                      ${CLUSTER_COLORS[p.cluster_id % 4]}`}
                                        >
                                            {p.label}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map((fromP, i) => {
                            const rowTotal = Array.from(
                                { length: k },
                                (_, j) => counts[i]?.[j] ?? 0,
                            ).reduce((s, v) => s + v, 0);

                            return (
                                <tr
                                    key={fromP.cluster_id}
                                    className={
                                        current_cluster === fromP.cluster_id
                                            ? "bg-blue-50"
                                            : ""
                                    }
                                >
                                    <td className="py-2 pr-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs text-gray-400">
                                                C{fromP.cluster_id}
                                            </span>
                                            <span
                                                className={`text-xs font-semibold px-1.5 py-0.5 rounded-full
            w-fit ${CLUSTER_COLORS[fromP.cluster_id % 4]}`}
                                            >
                                                {fromP.label}
                                            </span>
                                            <span className="text-xs text-gray-300">
                                                n={rowTotal}
                                            </span>
                                        </div>
                                    </td>
                                    {Array.from({ length: k }, (_, j) => {
                                        const prob = probabilities[i]?.[j] ?? 0;
                                        const count = counts[i]?.[j] ?? 0;
                                        const isMostLikely =
                                            i === current_cluster &&
                                            j === most_likely_next;
                                        const lowConfidence = rowTotal < 3;

                                        return (
                                            <td key={j} className="py-1 px-1">
                                                <div
                                                    className={`rounded text-center py-2 px-1 text-sm
              font-mono font-semibold
              ${lowConfidence ? "opacity-40" : ""}
              ${prob === 0 ? "bg-white text-gray-200" : probColor(prob)}
              ${isMostLikely ? "ring-2 ring-yellow-400" : ""}
            `}
                                                >
                                                    {prob === 0 ? (
                                                        <span className="text-gray-200">
                                                            —
                                                        </span>
                                                    ) : showCounts ? (
                                                        count
                                                    ) : (
                                                        `${(prob * 100).toFixed(0)}%`
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-gray-400">
                Yellow ring = most likely next transition from current regime.
                Only actual regime changes are counted — same-regime persistence
                excluded.
            </p>
        </div>
    );
}
