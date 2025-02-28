import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ModuleExplorer from "@/pages/ModuleExplorer";
import { useEffect, useState } from "react";

// Check if we're running as a Chrome extension
const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

export default function App() {
  const [extensionError, setExtensionError] = useState<string | null>(null);

  useEffect(() => {
    // Verify extension messaging if we're in extension mode
    if (isExtension) {
      chrome.runtime.sendMessage({ type: "PING" }, (response) => {
        if (chrome.runtime.lastError) {
          setExtensionError(`Extension error: ${chrome.runtime.lastError.message}`);
        }
      });
    }
  }, []);

  if (extensionError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Extension Error</h1>
          <p className="text-muted-foreground">{extensionError}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please check that the extension is properly installed and try reloading.
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`${isExtension ? 'w-[600px] h-[500px]' : 'min-h-screen'} overflow-auto bg-background text-foreground p-4`}>
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