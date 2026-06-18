"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  LayoutDashboard,
  Network,
  TrendingUp,
  FlaskConical,
  Activity,
  BarChart3,
} from "lucide-react";

const NAV = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/markets", label: "Markets", icon: Network },
  { href: "/app/regimes", label: "Regimes", icon: Activity },
  { href: "/app/signals", label: "Signals", icon: TrendingUp },
  { href: "/app/research", label: "Research", icon: FlaskConical },
];

export function Sidebar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border z-50",
        "flex flex-col transition-[width] duration-200 ease-out overflow-hidden",
        hovered ? "w-56" : "w-16",
      )}
    >
      {/* logo */}
      <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-md bg-primary/20 border border-primary/30
            flex items-center justify-center flex-shrink-0"
          >
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <span
            className={cn(
              "font-bold text-foreground tracking-tight whitespace-nowrap transition-opacity duration-150",
              hovered ? "opacity-100 delay-75" : "opacity-0",
            )}
          >
            MacroLens
          </span>
        </Link>
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 h-10 px-2.5 rounded-lg text-sm",
                "transition-colors duration-150 group relative",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px] flex-shrink-0",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span
                className={cn(
                  "whitespace-nowrap transition-opacity duration-150",
                  hovered ? "opacity-100 delay-75" : "opacity-0",
                )}
              >
                {item.label}
              </span>

              {/* active indicator bar, visible even when collapsed */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5
                  bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* footer */}
      <div className="px-4 py-4 border-t border-border flex-shrink-0">
        <p
          className={cn(
            "text-xs text-muted-foreground whitespace-nowrap transition-opacity duration-150",
            hovered ? "opacity-100 delay-75" : "opacity-0",
          )}
        >
          Not financial advice.
        </p>
      </div>
    </aside>
  );
}
