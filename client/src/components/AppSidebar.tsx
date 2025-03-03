// /PythonLibraryExplorer/client/src/components/AppSidebar.tsx
import { Plus, Package, Box, Power, Trash2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendExtensionMessage } from "@/lib/queryClient";
import { useState } from "react";
import { toast } from "sonner";

interface VirtualEnv {
  id: string;
  name: string;
  isActive: boolean;
}

export function AppSidebar() {
  const [newEnvName, setNewEnvName] = useState("");
  const [packageName, setPackageName] = useState("");
  const queryClient = useQueryClient();

  const { data: virtualEnvs = [] } = useQuery({
    queryKey: ['virtualEnvs'] as const,
    queryFn: () => sendExtensionMessage("listVirtualEnvs", {})
      .then(response => response as VirtualEnv[])
  });

  const createVenvMutation = useMutation({
    mutationFn: (name: string) => sendExtensionMessage("createVirtualEnv", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtualEnvs'] });
      setNewEnvName("");
      toast.success(`Created ${newEnvName}`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteVenvMutation = useMutation({
    mutationFn: (id: string) => sendExtensionMessage("deleteVirtualEnv", { id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['virtualEnvs'] });
      toast.success("Environment deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const setActiveVenvMutation = useMutation({
    mutationFn: (id: string) => sendExtensionMessage("setActiveVirtualEnv", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtualEnvs'] });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const installPackageMutation = useMutation({
    mutationFn: (name: string) => sendExtensionMessage("installPackage", { packageName: name }),
    onSuccess: () => {
      setPackageName("");
      toast.success(`Installed ${packageName}`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Virtual Environments
                </span>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-2 p-2">
                <div className="space-y-2">
                  {virtualEnvs.map((env) => (
                    <div key={env.id} className="flex items-center gap-2">
                      <Button
                        variant={env.isActive ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 justify-start gap-2"
                        onClick={() => {
                          if (!env.isActive) {
                            setActiveVenvMutation.mutate(env.id);
                          }
                        }}
                      >
                        <Power 
                          className={`h-4 w-4 ${env.isActive ? "text-green-500" : "text-gray-400"}`}
                        />
                        {env.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => deleteVenvMutation.mutate(env.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Environment name"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newEnvName) {
                        createVenvMutation.mutate(newEnvName);
                      }
                    }}
                  />
                  <Button
                    className="h-8 px-2"
                    variant="outline"
                    onClick={() => newEnvName && createVenvMutation.mutate(newEnvName)}
                    disabled={!newEnvName}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Install Package
                </span>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-2 p-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Package name"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && packageName) {
                        installPackageMutation.mutate(packageName);
                      }
                    }}
                  />
                  <Button
                    className="h-8 px-2"
                    variant="outline"
                    onClick={() => packageName && installPackageMutation.mutate(packageName)}
                    disabled={!packageName}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
} 