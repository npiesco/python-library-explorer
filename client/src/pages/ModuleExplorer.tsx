import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PackageInstaller } from "@/components/PackageInstaller";
import { ModuleTree } from "@/components/ModuleTree";
import { HelpDisplay } from "@/components/HelpDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Package } from "lucide-react";
import type { ModuleAttribute } from "@shared/schema";

export default function ModuleExplorer() {
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: moduleData, isLoading } = useQuery({
    queryKey: ["/api/modules", selectedModule],
    enabled: !!selectedModule,
  });

  const { mutate: searchModules } = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/modules/search?q=${query}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
  });

  return (
    <div className="w-[800px] h-[600px] p-4">
      <Tabs defaultValue="explorer" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="explorer">Module Explorer</TabsTrigger>
          <TabsTrigger value="packages">Package Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter module name..."
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                />
                <Button variant="outline" onClick={() => searchModules(searchQuery)}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ModuleTree
                  data={moduleData as ModuleAttribute[]}
                  isLoading={isLoading}
                  onSelect={(attr) => setSelectedModule(attr)}
                />
                <HelpDisplay module={selectedModule} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <PackageInstaller />
        </TabsContent>
      </Tabs>
    </div>
  );
}
