import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { sendExtensionMessage } from "@/lib/queryClient";

interface HelpDisplayProps {
  module: string;
}

export function HelpDisplay({ module }: HelpDisplayProps) {
  const { data: helpText, isLoading } = useQuery({
    queryKey: ["moduleHelp", module],
    queryFn: () => sendExtensionMessage("getModuleHelp", { moduleName: module }),
    enabled: !!module,
  });

  if (!module) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <HelpCircle className="h-12 w-12 mx-auto mb-2" />
        <p>Select a module or attribute to view help</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="animate-pulse h-[400px] bg-muted rounded-md" />;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <ScrollArea className="h-[400px]">
          <pre className="whitespace-pre-wrap font-mono text-sm">{helpText as string || ""}</pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}