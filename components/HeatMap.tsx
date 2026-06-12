"use client";

import { CorrelationEntry, Asset } from "@/lib/types";

interface Props {
    assets: Asset[];
    correlations: CorrelationEntry[];
    onSelectPair: (a: string, b: string) => void;
    selectedPair: [string, string] | null;
}

function correlationColor(v: number): string {
    if (v > 0) {
        const intensity = Math.round(v * 180);
        return `rgb(${220 - intensity}, ${220}, ${220 - intensity})`;
    } else {
        const intensity = Math.round(Math.abs(v) * 180);
        return `rgb(${220}, ${220 - intensity}, ${220 - intensity})`;
    }
}

function zscoreStyle(z: number): string {
    return Math.abs(z) > 2 ? "2px solid #ef4444" : "2px solid transparent";
}

export default function HeatMap({
    assets,
    correlations,
    onSelectPair,
    selectedPair,
}: Props) {
    const symbols = assets.map((a) => a.symbol);

    const lookup = new Map<string, CorrelationEntry>();
    for (const c of correlations) {
        lookup.set(`${c.symbol_a}/${c.symbol_b}`, c);
        lookup.set(`${c.symbol_b}/${c.symbol_a}`, c);
    }

    function getCell(a: string, b: string): CorrelationEntry | null {
        return lookup.get(`${a}/${b}`) ?? null;
    }

    return (
        <div className="overflow-auto">
            <table className="border-collapse text-xs">
                <thead>
                    <tr>
                        <th className="w-16" />
                        {symbols.map((s) => (
                            <th
                                key={s}
                                className="w-16 h-16 font-mono font-semibold text-gray-500 text-center px-1"
                            >
                                {s}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {symbols.map((rowSymbol) => (
                        <tr key={rowSymbol}>
                            <td className="font-mono font-semibold text-gray-500 pr-2 text-right whitespace-nowrap">
                                {rowSymbol}
                            </td>
                            {symbols.map((colSymbol) => {
                                if (rowSymbol === colSymbol) {
                                    return (
                                        <td
                                            key={colSymbol}
                                            className="w-16 h-16 text-center font-bold text-gray-400"
                                            style={{ background: "#e5e7eb" }}
                                        >
                                            1.00
                                        </td>
                                    );
                                }

                                const cell = getCell(rowSymbol, colSymbol);
                                if (!cell) {
                                    return (
                                        <td
                                            key={colSymbol}
                                            className="w-16 h-16 bg-gray-100"
                                        />
                                    );
                                }

                                const isSelected =
                                    selectedPair &&
                                    ((selectedPair[0] === rowSymbol &&
                                        selectedPair[1] === colSymbol) ||
                                        (selectedPair[1] === rowSymbol &&
                                            selectedPair[0] === colSymbol));

                                return (
                                    <td
                                        key={colSymbol}
                                        onClick={() =>
                                            onSelectPair(rowSymbol, colSymbol)
                                        }
                                        className="w-16 h-16 text-center cursor-pointer transition-opacity hover:opacity-80"
                                        style={{
                                            background: correlationColor(
                                                cell.correlation,
                                            ),
                                            outline: isSelected
                                                ? "3px solid #3b82f6"
                                                : zscoreStyle(cell.zscore),
                                            outlineOffset: "-2px",
                                        }}
                                        title={`${rowSymbol}/${colSymbol}\ncorr: ${cell.correlation.toFixed(3)}\nz: ${cell.zscore.toFixed(2)}`}
                                    >
                                        <div className="font-mono font-bold text-gray-800">
                                            {cell.correlation.toFixed(2)}
                                        </div>
                                        <div
                                            className={`text-gray-600 ${Math.abs(cell.zscore) > 2 ? "text-red-600 font-bold" : ""}`}
                                        >
                                            z{cell.zscore.toFixed(1)}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-2">
                Red border = anomalous Z-score (&gt;2σ). Click any cell to see
                pair history.
            </p>
        </div>
    );
}
