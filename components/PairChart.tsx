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
import { fetchPairHistory } from "@/lib/api";
import { PairHistory } from "@/lib/types";

interface Props {
    symbolA: string;
    symbolB: string;
    window: number;
}

export default function PairChart({ symbolA, symbolB, window }: Props) {
    const queryKey = `${symbolA}:${symbolB}:${window}`;
    const [result, setResult] = useState<{
        queryKey: string;
        data: PairHistory[];
    } | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetchPairHistory(symbolA, symbolB, window).then((data) => {
            if (cancelled) return;
            setResult({ queryKey, data });
        });

        return () => {
            cancelled = true;
        };
    }, [symbolA, symbolB, window, queryKey]);

    const loading = result?.queryKey !== queryKey;
    const data = result?.data ?? [];

    if (loading)
        return <div className="text-gray-400 text-sm p-4">Loading...</div>;
    if (!data.length)
        return <div className="text-gray-400 text-sm p-4">No data</div>;

    return (
        <div>
            <h3 className="font-mono font-bold text-gray-700 mb-1">
                {symbolA} / {symbolB}
                <span className="ml-2 text-xs font-normal text-gray-400">
                    {window}d rolling correlation
                </span>
            </h3>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => v.slice(5)} // show MM-DD only
                        interval={Math.floor(data.length / 6)}
                    />
                    <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
                    <ReferenceLine
                        y={0}
                        stroke="#94a3b8"
                        strokeDasharray="3 3"
                    />
                    <ReferenceLine
                        y={0.7}
                        stroke="#86efac"
                        strokeDasharray="2 2"
                        strokeOpacity={0.6}
                    />
                    <ReferenceLine
                        y={-0.7}
                        stroke="#fca5a5"
                        strokeDasharray="2 2"
                        strokeOpacity={0.6}
                    />
                    <Tooltip
                        formatter={(value) =>
                            typeof value === "number"
                                ? value.toFixed(3)
                                : value == null
                                ? ""
                                : String(value)
                        }
                        labelStyle={{ fontSize: 11 }}
                        contentStyle={{ fontSize: 11 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="correlation"
                        stroke="#3b82f6"
                        dot={false}
                        strokeWidth={1.5}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
