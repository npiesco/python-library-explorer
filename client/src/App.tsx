import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ModuleExplorer from "@/pages/ModuleExplorer";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-[800px] h-[600px] overflow-auto bg-background text-foreground p-4">
        <h1 className="text-2xl font-bold mb-4">Python Module Explorer</h1>
        <ModuleExplorer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}