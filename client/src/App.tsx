// /PythonLibraryExplorer/client/src/App.tsx
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ModuleExplorer from "@/pages/ModuleExplorer";
import { useEffect, useState } from "react";
import { useVenvStore } from '@/lib/store';
import { VirtualEnvManager } from '@/components/VirtualEnvManager';

// Check if we're running as a Chrome extension
const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

export default function App() {
  const [extensionError, setExtensionError] = useState<string | null>(null);
  const { cleanupVenvs } = useVenvStore();

  useEffect(() => {
    // Cleanup on app start
    cleanupVenvs();

    // Cleanup on app close
    const cleanup = () => {
      cleanupVenvs();
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [cleanupVenvs]);

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
          <img 
            src={isExtension ? "icons/icon48.svg" : "/icons/icon48.svg"} 
            alt="Python Module Explorer" 
            className="w-8 h-8"
            onError={(e) => {
              // Fallback if the icon fails to load
              e.currentTarget.src = isExtension ? "icons/icon.svg" : "/icons/icon.svg";
            }}
          />
          <h1 className="text-xl font-bold">Python Module Explorer</h1>
        </div>
        <ModuleExplorer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}