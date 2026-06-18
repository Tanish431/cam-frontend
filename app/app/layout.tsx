import { Sidebar } from "@/components/layout/Sidebar";
import { WindowProvider } from "@/providers/WindowProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-16 min-h-screen overflow-auto">
          {children}
        </div>
      </div>
    </WindowProvider>
  );
}
