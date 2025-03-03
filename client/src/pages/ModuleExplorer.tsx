// /PythonLibraryExplorer/client/src/pages/ModuleExplorer.tsx
import { useState } from "react";
import { HelpDisplay } from "@/components/HelpDisplay";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { sendExtensionMessage } from "@/lib/queryClient";
import type { Module } from "@/lib/types";

export default function ModuleExplorer() {
  const [selectedModule, setSelectedModule] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'] as const,
    queryFn: () => sendExtensionMessage("getModules", {})
      .then(response => response as Module[])
  });

  const filteredModules = modules.filter((module: Module) => 
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-[250px_1fr] gap-4">
        <div className="border rounded-lg p-2 h-[calc(100vh-8rem)] overflow-auto">
          <div className="space-y-1">
            {filteredModules.map((module: Module) => (
              <button
                key={module.id}
                onClick={() => setSelectedModule(module.name)}
                className={`w-full text-left px-2 py-1 rounded hover:bg-accent ${
                  selectedModule === module.name ? "bg-accent" : ""
                }`}
              >
                {module.name}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[calc(100vh-8rem)]">
          <HelpDisplay module={selectedModule} />
        </div>
      </div>
    </div>
  );
}