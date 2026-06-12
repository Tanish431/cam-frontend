"use client";

import { RegimeEvent } from "@/lib/types";

interface Props {
    events: RegimeEvent[];
    onSelectPair: (a: string, b: string) => void;
}

function zColor(z: number): string {
    const abs = Math.abs(z);
    if (abs > 3) return "text-red-600 font-bold";
    if (abs > 2) return "text-orange-500 font-semibold";
    return "text-gray-600";
}

export default function RegimeEvents({ events, onSelectPair }: Props) {
    if (!events.length)
        return (
            <div className="text-gray-400 text-sm">No anomalies detected.</div>
        );

    return (
        <div className="space-y-1 max-h-96 overflow-y-auto">
            {events.map((e, i) => (
                <div
                    key={i}
                    onClick={() => onSelectPair(e.symbol_a, e.symbol_b)}
                    className="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-50 border border-gray-100 text-sm"
                >
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-800">
                            {e.symbol_a}/{e.symbol_b}
                        </span>
                        <span className="text-xs text-gray-400">
                            {e.window_days}d
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-gray-600">
                            r={e.correlation.toFixed(3)}
                        </span>
                        <span className={`font-mono ${zColor(e.zscore)}`}>
                            z={e.zscore.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400">{e.time}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
