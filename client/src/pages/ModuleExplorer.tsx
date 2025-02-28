import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PackageInstaller } from "@/components/PackageInstaller";
import { ModuleTree } from "@/components/ModuleTree";
import { HelpDisplay } from "@/components/HelpDisplay";
import { VirtualEnvManager } from "@/components/VirtualEnvManager";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import type { ModuleAttribute } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ModuleExplorer() {
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: moduleData, isLoading } = useQuery<ModuleAttribute[]>({
    queryKey: ["/api/modules", selectedModule],
    enabled: !!selectedModule,
  });

  const { mutate: searchModules } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/modules/search", { 
        moduleName: selectedModule,
        query: searchQuery 
      });
      return response.json();
    },
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="explorer" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="explorer">Module Explorer</TabsTrigger>
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter module name (e.g., numpy, pandas)..."
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                />
                <Input
                  placeholder="Search attributes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline" onClick={() => searchModules()}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ModuleTree
                  data={moduleData}
                  isLoading={isLoading}
                  onSelect={(attr) => setSelectedModule(attr)}
                />
                <HelpDisplay module={selectedModule} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environments">
          <VirtualEnvManager />
        </TabsContent>

        <TabsContent value="packages">
          <PackageInstaller />
        </TabsContent>
      </Tabs>
    </div>
  );
}