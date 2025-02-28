import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { insertVirtualEnvSchema, type VirtualEnv } from "@shared/schema";
import { FolderPlus, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { sendExtensionMessage } from "@/lib/queryClient";

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
    mutationFn: async (id: number) => {
      return sendExtensionMessage("setActiveVirtualEnv", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virtualEnvs"] });
      toast({
        title: "Environment Activated",
        description: "Virtual environment switched successfully",
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
                  <FormLabel>Environment Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="my-project" />
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
          <div className="space-y-2">
            {virtualEnvs.map((env) => (
              <div
                key={env.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{env.name}</span>
                  {env.isActive && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                {!env.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActive(env.id)}
                  >
                    Activate
                  </Button>
                )}
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