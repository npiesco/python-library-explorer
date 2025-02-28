import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ModuleExplorer from "@/pages/ModuleExplorer";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-[600px] h-[500px] overflow-auto bg-background text-foreground p-4">
        <div className="flex items-center gap-2 mb-4">
          <img src="/icons/icon48.svg" alt="Python Module Explorer" className="w-8 h-8" />
          <h1 className="text-xl font-bold">Python Module Explorer</h1>
        </div>
        <ModuleExplorer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}