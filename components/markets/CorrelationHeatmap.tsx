"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

interface Asset {
  id: number;
  symbol: string;
  name: string;
  asset_class: string;
}
interface CorrelationEntry {
  symbol_a: string;
  symbol_b: string;
  correlation: number;
  zscore: number;
}

function cellColor(v: number): string {
  if (v > 0) return `rgba(74, 222, 128, ${Math.min(Math.abs(v), 1) * 0.7})`;
  return `rgba(248, 113, 113, ${Math.min(Math.abs(v), 1) * 0.7})`;
}

export function CorrelationHeatmap({
  window,
  onSelectPair,
  selectedPair,
}: {
  window: number;
  onSelectPair: (a: string, b: string) => void;
  selectedPair: [string, string] | null;
}) {
  const { data: assets, loading: l1 } = useApi<Asset[]>(`/api/assets`, []);
  const { data: correlations, loading: l2 } = useApi<CorrelationEntry[]>(
    `/api/correlations?window=${window}`,
    [window],
  );

  if (l1 || l2) return <Skeleton className="h-80 w-full rounded-lg" />;
  if (!assets?.length || !correlations?.length) {
    return (
      <p className="text-sm text-muted-foreground">No correlation data.</p>
    );
  }

  const symbols = assets.map((a) => a.symbol);
  const lookup = new Map<string, CorrelationEntry>();
  for (const c of correlations) {
    lookup.set(`${c.symbol_a}/${c.symbol_b}`, c);
    lookup.set(`${c.symbol_b}/${c.symbol_a}`, c);
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
                className="w-16 h-12 font-mono font-medium
                text-muted-foreground text-center px-1"
              >
                {s.replace("-USD", "").replace("^", "")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symbols.map((rowSymbol) => (
            <tr key={rowSymbol}>
              <td
                className="font-mono font-medium text-muted-foreground
                pr-2 text-right whitespace-nowrap"
              >
                {rowSymbol.replace("-USD", "").replace("^", "")}
              </td>
              {symbols.map((colSymbol) => {
                if (rowSymbol === colSymbol) {
                  return (
                    <td
                      key={colSymbol}
                      className="w-16 h-16 text-center font-bold
                        text-muted-foreground/40 bg-muted/30 rounded-sm"
                    >
                      1.00
                    </td>
                  );
                }
                const cell = lookup.get(`${rowSymbol}/${colSymbol}`);
                if (!cell) return <td key={colSymbol} className="w-16 h-16" />;

                const isSelected =
                  selectedPair &&
                  ((selectedPair[0] === rowSymbol &&
                    selectedPair[1] === colSymbol) ||
                    (selectedPair[1] === rowSymbol &&
                      selectedPair[0] === colSymbol));
                const isAnomaly = Math.abs(cell.zscore) > 2;

                return (
                  <td
                    key={colSymbol}
                    onClick={() => onSelectPair(rowSymbol, colSymbol)}
                    className="w-16 h-16 text-center cursor-pointer rounded-sm
                      transition-all hover:scale-[1.03]"
                    style={{
                      background: cellColor(cell.correlation),
                      outline: isSelected
                        ? "2px solid #4f8ef7"
                        : isAnomaly
                          ? "1.5px solid #ef4444"
                          : "1px solid transparent",
                      outlineOffset: "-1px",
                    }}
                    title={`${rowSymbol}/${colSymbol} · r=${cell.correlation.toFixed(3)} · z=${cell.zscore.toFixed(2)}`}
                  >
                    <div className="font-mono font-bold text-foreground/90">
                      {cell.correlation.toFixed(2)}
                    </div>
                    <div
                      className={`font-mono text-[10px] ${
                        isAnomaly
                          ? "text-red-400 font-bold"
                          : "text-muted-foreground"
                      }`}
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
      <p className="text-xs text-muted-foreground mt-3">
        Red outline = anomalous (|z| &gt; 2σ) · Click any cell for detailed pair
        analysis
      </p>
    </div>
  );
}
