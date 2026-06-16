"use client";

import { useWindow } from "@/providers/WindowProvider";
import { cn } from "@/lib/utils";

const WINDOWS = [
  { value: 20, label: "20d", desc: "Short-term" },
  { value: 60, label: "60d", desc: "Medium-term" },
  { value: 252, label: "252d", desc: "Long-term" },
] as const;

export function WindowSelector() {
  const { window, setWindow } = useWindow();
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      {WINDOWS.map((w) => (
        <button
          key={w.value}
          onClick={() => setWindow(w.value)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            window === w.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
