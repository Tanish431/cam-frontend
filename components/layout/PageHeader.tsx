import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, className, children }: Props) {
  return (
    <div className={cn("mb-6", className)}>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
