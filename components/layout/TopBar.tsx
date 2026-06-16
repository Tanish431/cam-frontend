"use client";

import { WindowSelector } from "@/components/shared/WindowSelector";
import { Bell, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: Props) {
  return (
    <header
      className="h-14 border-b border-border bg-card/50 backdrop-blur-sm
      flex items-center justify-between px-6 sticky top-0 z-40"
    >
      <div>
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <WindowSelector />
        <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
          <a href="https://github.com/YOUR_REPO" target="_blank" rel="noopener">
            <GitBranch className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}
