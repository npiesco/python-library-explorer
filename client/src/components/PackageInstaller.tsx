import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVenvStore } from "@/lib/store";
import { queryClient } from "@/lib/queryClient";

export function PackageInstaller() {
  const [installing, setInstalling] = useState(false);
  const [packageName, setPackageName] = useState("");
  const { toast } = useToast();
  const { activeVenv } = useVenvStore();

  const handleInstallPackage = async () => {
    if (!packageName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a package name",
        variant: "destructive"
      });
      return;
    }

    if (!activeVenv) {
      toast({
        title: "Error",
        description: "No active virtual environment",
        variant: "destructive"
      });
      return;
    }

    setInstalling(true);
    
    try {
      console.log('Installing package:', {
        packageName,
        envId: activeVenv.id
      });
      
      const response = await fetch('/api/packages/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: packageName,
          version: 'latest',
          envId: activeVenv.id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to install package');
      }

      toast({
        title: "Success",
        description: `Successfully installed ${packageName}`,
      });
      
      setPackageName('');
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    } catch (error: any) {
      console.error('Installation error:', error);
      toast({
        title: "Installation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install Package</CardTitle>
        <CardDescription>
          Install Python packages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Package Name</label>
            <Input 
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="Enter package name (e.g. numpy)"
            />
          </div>

          <Button
            onClick={handleInstallPackage}
            disabled={installing || !packageName.trim() || !activeVenv}
            className="w-full"
          >
            {installing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Install Package
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}