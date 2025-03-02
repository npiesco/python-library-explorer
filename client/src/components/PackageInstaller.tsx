import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { insertPackageSchema } from "@shared/schema";
import { Package, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { sendExtensionMessage } from "@/lib/queryClient";
import type { VirtualEnv } from "@shared/schema";

export function PackageInstaller() {
  const [installing, setInstalling] = useState(false);
  const { toast } = useToast();

  // Get active environment
  const { data: virtualEnvs = [] } = useQuery<VirtualEnv[]>({
    queryKey: ["virtualEnvs"],
    queryFn: async () => sendExtensionMessage("listVirtualEnvs", {}) as Promise<VirtualEnv[]>,
  });

  const activeEnv = virtualEnvs.find(env => env.isActive);

  const form = useForm({
    resolver: zodResolver(insertPackageSchema),
    defaultValues: {
      name: "",
      version: "latest"
    },
  });

  const { mutate: installPackage } = useMutation({
    mutationFn: async (data: { name: string; version: string }) => {
      if (!activeEnv?.id) {
        throw new Error("No active virtual environment found. Please create and activate one first.");
      }
      setInstalling(true);
      return sendExtensionMessage("installPackage", {
        name: data.name,
        version: data.version,
        envId: activeEnv.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({
        title: "Package installed successfully",
        description: `Installed ${form.getValues().name}`,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to install package",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setInstalling(false),
  });

  return (
    <Card>
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => installPackage(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="numpy" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="latest" />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={installing || !activeEnv} 
              className="w-full"
              title={!activeEnv ? "Please create and activate a virtual environment first" : undefined}
            >
              {installing ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Install Package
                </>
              )}
            </Button>

            {installing && <Progress value={33} className="w-full" />}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}