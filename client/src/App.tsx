// /PythonLibraryExplorer/client/src/App.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ModuleExplorer from "@/pages/ModuleExplorer";
import { useEffect } from "react";
import { useVenvStore } from '@/lib/store';
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "sonner";

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
      <SidebarProvider>
        <div className="flex h-screen">
          <AppSidebar />
          <main className="flex-1 overflow-auto p-4">
            <ModuleExplorer />
          </main>
        </div>
      </SidebarProvider>
      <Toaster />
    </QueryClientProvider>
  );
}