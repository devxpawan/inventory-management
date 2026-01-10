import { Outlet } from "react-router-dom";
import { SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
import { InventorySidebar } from "@/components/inventory/InventorySidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function MainLayout() {
  return (
    <TooltipProvider>
      <Sonner />
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <InventorySidebar />
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-full items-center gap-4 px-6">
                <SidebarTrigger className="-ml-1" />
              </div>
            </header>
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
