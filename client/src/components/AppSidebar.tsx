// /PythonLibraryExplorer/client/src/components/AppSidebar.tsx
import { Plus, Package, Box, Power, Trash2, Loader2 } from "lucide-react";
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
import { useVenvStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import type { VirtualEnv } from "@shared/schema";

export function AppSidebar() {
  const [newEnvName, setNewEnvName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: virtualEnvs = [], isLoading } = useQuery({
    queryKey: ['virtualEnvs'] as const,
    queryFn: async () => {
      const response = await sendExtensionMessage("listVirtualEnvs", {});
      // Add default timestamps if they don't exist
      return (response as VirtualEnv[]).map(env => ({
        ...env,
        createdAt: env.createdAt || new Date(),
        updatedAt: env.updatedAt || new Date()
      }));
    }
  });

  const activeEnv = virtualEnvs.find(env => env.isActive);

  const createVenvMutation = useMutation({
    mutationFn: async (name: string) => {
      setCreating(true);
      try {
        return await sendExtensionMessage("createVirtualEnv", { 
          name,
          path: `venv-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` 
        });
      } finally {
        setCreating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtualEnvs'] });
      setNewEnvName("");
      toast.success(`Created environment: ${newEnvName}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create environment: ${error.message}`);
    }
  });

  const deleteVenvMutation = useMutation({
    mutationFn: (id: string) => sendExtensionMessage("deleteVirtualEnv", { id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['virtualEnvs'] });
      toast.success("Environment deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete environment: ${error.message}`);
    }
  });

  const setActiveVenvMutation = useMutation({
    mutationFn: (id: string | null) => sendExtensionMessage("setActiveVirtualEnv", { id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['virtualEnvs'] });
      const env = virtualEnvs.find(e => e.id === id);
      if (env) {
        useVenvStore.getState().setActiveVenv(env);
      } else {
        useVenvStore.getState().setActiveVenv(null);
      }
      toast.success(id ? "Environment activated" : "Environment deactivated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to change environment: ${error.message}`);
    }
  });

  const installPackageMutation = useMutation({
    mutationFn: (name: string) => {
      if (!activeEnv) {
        throw new Error("No active environment selected");
      }
      return sendExtensionMessage("installPackage", { 
        name,
        envId: activeEnv.id,
        version: "latest"
      });
    },
    onSuccess: () => {
      setPackageName("");
      toast.success(`Installed ${packageName}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to install package: ${error.message}`);
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
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {virtualEnvs.map((env) => (
                      <div key={env.id} className="flex items-center gap-2">
                        <Button
                          variant={env.isActive ? "default" : "ghost"}
                          size="sm"
                          className="flex-1 justify-start gap-2"
                          onClick={() => {
                            if (env.isActive) {
                              setActiveVenvMutation.mutate(null);
                            } else {
                              setActiveVenvMutation.mutate(env.id);
                            }
                          }}
                        >
                          <Power 
                            className={`h-4 w-4 ${env.isActive ? "text-green-500" : "text-gray-400"}`}
                          />
                          {env.name}
                          {env.isActive && <span className="ml-auto text-xs text-muted-foreground">(active)</span>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => deleteVenvMutation.mutate(env.id)}
                          disabled={env.isActive}
                          title={env.isActive ? "Cannot delete active environment" : undefined}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
                    disabled={!newEnvName || creating}
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
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
                    placeholder={activeEnv ? "Package name" : "Select an environment first"}
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="h-8"
                    disabled={!activeEnv}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && packageName && activeEnv) {
                        installPackageMutation.mutate(packageName);
                      }
                    }}
                  />
                  <Button
                    className="h-8 px-2"
                    variant="outline"
                    onClick={() => packageName && installPackageMutation.mutate(packageName)}
                    disabled={!packageName || !activeEnv || installPackageMutation.isPending}
                  >
                    {installPackageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
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