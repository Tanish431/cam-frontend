"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Network,
  TrendingUp,
  BarChart3,
  FlaskConical,
  Activity,
} from "lucide-react";

const NAV = [
  {
    href: "/app",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/app/markets",
    label: "Markets",
    icon: Network,
  },
  {
    href: "/app/regimes",
    label: "Regimes",
    icon: Activity,
  },
  {
    href: "/app/signals",
    label: "Signals",
    icon: TrendingUp,
  },
  {
    href: "/app/research",
    label: "Research",
    icon: FlaskConical,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56
      bg-card border-r border-border flex flex-col z-50"
    >
      {/* logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md bg-primary/20 border border-primary/30
            flex items-center justify-center"
          >
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-foreground tracking-tight">
            MacroLens
          </span>
        </Link>
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && pathname !== "/app"
              ? true
              : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
                "transition-all duration-150 group",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Not financial advice.</p>
      </div>
    </aside>
  );
}
