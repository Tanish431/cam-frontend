"use client";

import { cn } from "@/lib/utils";

const ASSETS = [
  "SPY",
  "QQQ",
  "GLD",
  "TLT",
  "DX-Y.NYB",
  "BTC-USD",
  "USO",
  "^VIX",
];

interface Props {
  value: string | null;
  onChange: (symbol: string) => void;
  className?: string;
}

export default function AssetSelector({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {ASSETS.map((symbol) => (
        <button
          key={symbol}
          onClick={() => onChange(symbol)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border",
            value === symbol
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:bg-muted",
          )}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
