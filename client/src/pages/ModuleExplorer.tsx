// /PythonLibraryExplorer/client/src/pages/ModuleExplorer.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PackageInstaller } from "@/components/PackageInstaller";
import { ModuleTree } from "@/components/ModuleTree";
import { HelpDisplay } from "@/components/HelpDisplay";
import { VirtualEnvManager } from "@/components/VirtualEnvManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Command } from "lucide-react";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ModuleAttribute, VirtualEnv } from "@shared/schema";
import { sendExtensionMessage } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useVenvStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Set active environment when data is loaded
  useEffect(() => {
    const active = virtualEnvs.find(env => env.isActive);
    if (active) {
      console.log('Found active environment:', active);
    }
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

  const { data: moduleData, isLoading } = useQuery<ModuleAttribute[], Error, ModuleAttribute[]>({
    queryKey: ["moduleAttributes", selectedModule],
    queryFn: async () => {
      if (!selectedModule) return [];
      const response = await sendExtensionMessage("getModuleAttributes", { moduleName: selectedModule });
      return response as ModuleAttribute[];
    },
    enabled: !!selectedModule,
  });

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
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col h-full">
        <header className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Module Explorer</h1>
            <div className="flex-1 max-w-2xl">
              <Input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-base h-10"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCommandOpen(true)}
            className="ml-2"
          >
            <Command className="h-5 w-5" />
            <span className="sr-only">Open command palette</span>
          </Button>
        </header>

        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full rounded-lg"
          >
            <ResizablePanel
              defaultSize={30}
              minSize={20}
              className="flex flex-col"
            >
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold">Module Structure</h2>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {isLoading ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-[80%]" />
                          <Skeleton className="h-6 w-[70%] ml-4" />
                          <Skeleton className="h-6 w-[60%] ml-8" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-[75%]" />
                          <Skeleton className="h-6 w-[65%] ml-4" />
                          <Skeleton className="h-6 w-[55%] ml-8" />
                        </div>
                      </div>
                    ) : (
                      <ModuleTree
                        data={moduleData}
                        isLoading={isLoading}
                        onSelect={(attr) => setSelectedModule(attr)}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-[2px] bg-border hover:bg-primary/10 transition-colors" />

            <ResizablePanel
              defaultSize={70}
              className="flex flex-col"
            >
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold">Documentation</h2>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {isLoading ? (
                      <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-[90%]" />
                          <Skeleton className="h-6 w-[95%]" />
                          <Skeleton className="h-6 w-[85%]" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-[80%]" />
                          <Skeleton className="h-6 w-[100%]" />
                          <Skeleton className="h-6 w-[90%]" />
                          <Skeleton className="h-6 w-[95%]" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-[85%]" />
                          <Skeleton className="h-6 w-[90%]" />
                          <Skeleton className="h-6 w-[95%]" />
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-4xl mx-auto">
                        <HelpDisplay module={selectedModule} />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
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