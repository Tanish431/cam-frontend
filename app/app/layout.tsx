import { Sidebar } from "@/components/layout/Sidebar";
import { WindowProvider } from "@/providers/WindowProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-56">{children}</div>
      </div>
    </WindowProvider>
  );
}
