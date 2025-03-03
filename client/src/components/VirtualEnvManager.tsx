// /PythonLibraryExplorer/client/src/components/VirtualEnvManager.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { insertVirtualEnvSchema, type VirtualEnv } from "@shared/schema";
import { FolderPlus , Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { sendExtensionMessage } from "@/lib/queryClient";
import { useVenvStore } from "@/lib/store";

export function VirtualEnvManager() {
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertVirtualEnvSchema),
    defaultValues: {
      name: "",
      path: "./venv",
      isActive: true,
    },
  });

  const { data: virtualEnvs = [], isLoading } = useQuery<VirtualEnv[]>({
    queryKey: ["virtualEnvs"],
    queryFn: async () => sendExtensionMessage("listVirtualEnvs", {}) as Promise<VirtualEnv[]>,
  });

  useEffect(() => {
    if (virtualEnvs) {
      const activeEnv = virtualEnvs.find(env => env.isActive);
      if (activeEnv) {
        useVenvStore.getState().setActiveVenv(activeEnv);
      }
    }
  }, [virtualEnvs]);

  const { mutate: createVenv } = useMutation({
    mutationFn: async (data: { name: string; path: string }) => {
      setCreating(true);
      return sendExtensionMessage("createVirtualEnv", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virtualEnvs"] });
      toast({
        title: "Virtual Environment Created",
        description: `Created new environment: ${form.getValues().name}`,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create environment",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setCreating(false),
  });

  const { mutate: setActive } = useMutation({
    mutationFn: async (id: string) => {
      return sendExtensionMessage("setActiveVenv", { id });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["virtualEnvs"] });
      const env = virtualEnvs.find(e => e.id === id);
      if (env) {
        useVenvStore.getState().setActiveVenv(env);
      }
      toast({
        title: "Environment Activated",
        description: "Virtual environment switched successfully",
      });
    },
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: async () => {
      return sendExtensionMessage("setActiveVenv", { id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virtualEnvs"] });
      useVenvStore.getState().setActiveVenv(null);
      toast({
        title: "Environment Deactivated",
        description: "Virtual environment deactivated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to deactivate environment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteVenv } = useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new Error("Environment ID is required");
      return sendExtensionMessage("deleteVirtualEnv", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virtualEnvs"] });
      toast({
        title: "Virtual Environment Deleted",
        description: "Environment was successfully deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete environment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Virtual Environments</CardTitle>
        <CardDescription>
          Create and manage Python virtual environments for your packages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createVenv(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="venv-name">Environment Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      id="venv-name"
                      name="venv-name"
                      placeholder="my-project" 
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a descriptive name for your virtual environment
                  </FormDescription>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={creating} className="w-full">
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Environment...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Environment
                </>
              )}
            </Button>
          </form>
        </Form>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ) : virtualEnvs.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Existing Environments</h3>
            {virtualEnvs.map((env) => (
              <div key={env.id} className="flex items-center justify-between p-2 bg-muted rounded-md mb-2">
                <div>
                  <span className={env.isActive ? "font-bold" : ""}>{env.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">{env.path}</span>
                </div>
                <div className="flex gap-2">
                  {env.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deactivate()}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActive(env.id)}
                    >
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteVenv(env.id)}
                    disabled={env.isActive}
                    title={env.isActive ? "Cannot delete active environment" : undefined}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FolderPlus className="h-12 w-12 mx-auto mb-2" />
            <p>No virtual environments created yet</p>
            <p className="text-sm">Create one to start installing packages</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}