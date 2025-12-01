import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-card flex items-center px-6 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-4 flex-1">
              <h2 className="text-sm font-medium text-muted-foreground">Business Virtual Assistant</h2>
            </div>
          </header>

          <main className="flex-1 p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
