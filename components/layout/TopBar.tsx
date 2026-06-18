"use client";

import { WindowSelector } from "@/components/shared/WindowSelector";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: Props) {
  return (
    <header
      className="h-16 border-b border-border bg-background/95
      backdrop-blur-sm flex items-center justify-between px-6
      sticky top-0 z-40"
    >
      <div className="py-4">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <WindowSelector />
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground"
          asChild
        >
          <a
            href="https://github.com/Tanish431/cross-asset-monitor"
            target="_blank"
            rel="noopener"
          >
            <GitBranch className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}
