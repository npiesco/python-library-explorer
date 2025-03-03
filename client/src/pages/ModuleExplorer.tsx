// /PythonLibraryExplorer/client/src/pages/ModuleExplorer.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModuleTree } from "@/components/ModuleTree";
import { HelpDisplay } from "@/components/HelpDisplay";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command } from "lucide-react";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

import type { ModuleAttribute, VirtualEnv } from "@shared/schema";
import { sendExtensionMessage } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useVenvStore } from "@/lib/store";

type SearchFilter = "all" | "functions" | "classes" | "variables";

export function ModuleExplorer() {
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const { toast } = useToast();
  const { activeVenv } = useVenvStore();

  // Fetch active environment on mount
  const { data: virtualEnvs = [] } = useQuery<VirtualEnv[]>({
    queryKey: ["virtualEnvs"],
    queryFn: async () => {
      const response = await fetch('/api/venv');
      if (!response.ok) {
        throw new Error('Failed to fetch virtual environments');
      }
      return response.json();
    }
  });

  const { data: moduleData, isLoading } = useQuery<ModuleAttribute[], Error, ModuleAttribute[]>({
    queryKey: ["moduleAttributes", selectedModule],
    queryFn: async () => {
      if (!selectedModule) return [];
      const response = await sendExtensionMessage("getModuleAttributes", { moduleName: selectedModule });
      return response as ModuleAttribute[];
    },
    enabled: !!selectedModule,
  });

  // Set active environment when data is loaded
  useEffect(() => {
    const active = virtualEnvs.find(env => env.isActive);
  }, [virtualEnvs]);

  // Command palette keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { mutate: searchModules } = useMutation({
    mutationFn: async () => {
      if (!selectedModule || !searchQuery) {
        throw new Error("Please enter both a module name and a search query");
      }
      const response = await sendExtensionMessage("searchModuleAttributes", { 
        moduleName: selectedModule,
        query: searchQuery,
        filter: searchFilter
      });
      return response as ModuleAttribute[];
    },
    onSuccess: (data) => {
      toast({
        title: "Search Results",
        description: `Found ${data.length} matching attributes`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const commands = [
    {
      title: "Toggle Environment Setup",
      action: () => document.querySelector<HTMLButtonElement>('[data-accordion-trigger]')?.click(),
      shortcut: "E"
    },
    {
      title: "Focus Module Search",
      action: () => document.querySelector<HTMLInputElement>('[data-module-search]')?.focus(),
      shortcut: "M"
    },
    {
      title: "Focus Attribute Search",
      action: () => document.querySelector<HTMLInputElement>('[data-attribute-search]')?.focus(),
      shortcut: "F"
    },
    {
      title: "Clear Search",
      action: () => {
        setSearchQuery("");
        setSearchFilter("all");
      },
      shortcut: "C"
    }
  ];

  return (
    <div className="flex h-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          maxSize={30}
          className="bg-background"
        >
          <div className="flex h-full flex-col gap-4 p-6">
            <div className="flex gap-2 w-[75%]">
              <Input
                type="text"
                placeholder="Enter module name (e.g., numpy, pandas)..."
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="flex-1 text-base"
                data-module-search
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCommandOpen(true)}
                className="h-10 w-10"
              >
                <Command className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <ModuleTree
                  data={moduleData}
                  isLoading={isLoading}
                  onSelect={(attr) => setSelectedModule(attr)}
                />
              )}
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle className="w-[2px] bg-border hover:bg-primary/10 transition-colors" />
        <ResizablePanel
          defaultSize={70}
          minSize={70}
          maxSize={70}
          className="bg-background"
        >
          <div className="flex h-full flex-col">
            <div className="p-4 border-b">
              <Input
                type="text"
                placeholder="Search in documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xl"
                data-attribute-search
              />
            </div>
            <div className="flex-1 overflow-auto">
              <HelpDisplay module={selectedModule} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <div className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>
            Search for commands or use keyboard shortcuts to perform actions.
          </DialogDescription>
        </div>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            {commands.map((cmd) => (
              <CommandItem
                key={cmd.title}
                onSelect={() => {
                  cmd.action();
                  setIsCommandOpen(false);
                }}
              >
                <span>{cmd.title}</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>{cmd.shortcut}
                </kbd>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}