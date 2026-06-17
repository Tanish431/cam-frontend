import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  subtitle,
  href,
  children,
  className,
  contentClassName,
}: Props) {
  return (
    <Card className={cn("bg-card border-border shadow-none", className)}>
      <CardHeader
        className="flex flex-row items-start justify-between
        pb-3 space-y-0 border-b border-border/60"
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs text-muted-foreground
              hover:text-primary transition-colors flex-shrink-0"
          >
            View all
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className={cn("pt-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
