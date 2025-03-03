// /PythonLibraryExplorer/client/src/App.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ModuleExplorer } from "@/pages/ModuleExplorer";
import { useEffect } from "react";
import { useVenvStore } from '@/lib/store';
import { queryClient } from "@/lib/queryClient";
import { MainNav } from "@/components/MainNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";

export default function App() {
  const { cleanupVenvs } = useVenvStore();

  useEffect(() => {
    cleanupVenvs();
    
    const cleanup = () => {
      cleanupVenvs();
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [cleanupVenvs]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <SidebarProvider>
          <div className="flex h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center">
                <MainNav />
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <Separator />
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <main className="flex-1">
                <ModuleExplorer />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}