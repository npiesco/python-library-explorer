import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PackageInstaller } from "@/components/PackageInstaller";
import { ModuleTree } from "@/components/ModuleTree";
import { HelpDisplay } from "@/components/HelpDisplay";
import { VirtualEnvManager } from "@/components/VirtualEnvManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Command, KeyRound } from "lucide-react";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
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
import type { ModuleAttribute } from "@shared/schema";
import { sendExtensionMessage } from "@/lib/queryClient";

type APIResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

type SearchFilter = "all" | "function" | "class" | "method" | "property";

export default function ModuleExplorer() {
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [isCommandOpen, setIsCommandOpen] = useState(false);

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
      const response = await sendExtensionMessage("getModuleAttributes", { moduleName: selectedModule }) as APIResponse<ModuleAttribute[]>;
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!selectedModule,
  });

  const { mutate: searchModules } = useMutation<ModuleAttribute[], Error, void>({
    mutationFn: async () => {
      const response = await sendExtensionMessage("searchModuleAttributes", { 
        moduleName: selectedModule,
        query: searchQuery,
        filter: searchFilter
      }) as APIResponse<ModuleAttribute[]>;
      if (!response.success) throw new Error(response.error);
      return response.data;
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
    <TooltipProvider>
      <div className="h-full flex flex-col space-y-4">
        {/* Command Palette */}
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

        {/* Environment Setup Section - Collapsible */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="env-setup">
            <AccordionTrigger data-accordion-trigger>Environment Setup</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4">
                <VirtualEnvManager />
                <PackageInstaller />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator className="my-2" />

        {/* Module Explorer Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Module Explorer</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCommandOpen(true)}
                  >
                    <Command className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Command Palette (⌘K)
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2 mt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    data-module-search
                    placeholder="Enter module name (e.g., numpy, pandas)..."
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="flex-1"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Press ⌘M to focus
                </TooltipContent>
              </Tooltip>
              <div className="flex gap-2 flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      data-attribute-search
                      placeholder="Search attributes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    Press ⌘F to focus
                  </TooltipContent>
                </Tooltip>
                <Select
                  value={searchFilter}
                  onValueChange={(value) => setSearchFilter(value as SearchFilter)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="function">Functions</SelectItem>
                    <SelectItem value="class">Classes</SelectItem>
                    <SelectItem value="method">Methods</SelectItem>
                    <SelectItem value="property">Properties</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => searchModules()}>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Press Enter to search
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4">
                <Progress value={33} className="w-full" />
              </div>
            ) : (
              <ResizablePanelGroup direction="horizontal" className="min-h-[400px]">
                <ResizablePanel defaultSize={50}>
                  <div className="p-4 h-full">
                    <CardTitle className="text-sm mb-4">Module Structure</CardTitle>
                    <ModuleTree
                      data={moduleData}
                      isLoading={isLoading}
                      onSelect={(attr) => setSelectedModule(attr)}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>
                  <div className="p-4 h-full">
                    <CardTitle className="text-sm mb-4">Documentation</CardTitle>
                    <HelpDisplay module={selectedModule} />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}