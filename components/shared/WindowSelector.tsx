"use client";

import { useWindow } from "@/providers/WindowProvider";
import { cn } from "@/lib/utils";

const WINDOWS = [
  { value: 20, label: "20d" },
  { value: 60, label: "60d" },
  { value: 252, label: "252d" },
] as const;

export function WindowSelector() {
  const { window, setWindow } = useWindow();
  return (
    <div
      className="flex items-center gap-0.5 bg-muted/40 border border-border
      rounded-lg p-1"
    >
      {WINDOWS.map((w) => (
        <button
          key={w.value}
          onClick={() => setWindow(w.value)}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium font-mono transition-all",
            window === w.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
